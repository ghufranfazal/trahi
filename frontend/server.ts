import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { v2 as cloudinary } from "cloudinary";

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser middleware for JSON and audio data
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Lazy-initialized Gemini API client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!genAIClient && process.env.GEMINI_API_KEY) {
    genAIClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return genAIClient;
}

// Configure Cloudinary if environment variables are provided
const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  (process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_URL || process.env.CLOUDINARY_UPLOAD_PRESET)
);

if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    hasCloudinary: isCloudinaryConfigured,
  });
});

// Audio Upload Endpoint (Cloudinary with graceful fallback)
app.post("/api/upload-audio", async (req, res) => {
  try {
    const { audioData, mimeType = "audio/webm", fileName } = req.body;

    if (!audioData) {
      return res.status(400).json({ error: "Missing audioData in request body" });
    }

    // Check if Cloudinary is configured with API Secret
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      try {
        const uploadResult = await cloudinary.uploader.upload(audioData, {
          resource_type: "video", // Cloudinary treats audio files under video resource_type
          folder: "trahi_sos_audio",
          public_id: `sos_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        });

        return res.json({
          success: true,
          url: uploadResult.secure_url || uploadResult.url,
          publicId: uploadResult.public_id,
          provider: "cloudinary",
        });
      } catch (cloudErr: any) {
        console.warn("Cloudinary upload failed, falling back to data URL:", cloudErr?.message || cloudErr);
      }
    }

    // Check if Cloudinary Unsigned Upload Preset is configured
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_UPLOAD_PRESET) {
      try {
        const formData = new URLSearchParams();
        formData.append("file", audioData);
        formData.append("upload_preset", process.env.CLOUDINARY_UPLOAD_PRESET);
        formData.append("folder", "trahi_sos_audio");

        const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/auto/upload`, {
          method: "POST",
          body: formData,
        });

        if (cloudRes.ok) {
          const cloudData = await cloudRes.json();
          return res.json({
            success: true,
            url: cloudData.secure_url || cloudData.url,
            provider: "cloudinary_unsigned",
          });
        }
      } catch (unsignedErr: any) {
        console.warn("Cloudinary unsigned upload failed:", unsignedErr);
      }
    }

    // Fallback: Return the audio data URI or storage identifier
    // In production without Cloudinary, audio is safely retained as Data URI
    return res.json({
      success: true,
      url: audioData.startsWith("data:") ? audioData : `data:${mimeType};base64,${audioData}`,
      provider: "data_uri_fallback",
      message: "Audio processed (Configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in settings for hosted URLs)",
    });
  } catch (error: any) {
    console.error("Error in /api/upload-audio:", error);
    return res.status(500).json({ error: error.message || "Failed to process audio" });
  }
});

// Gemini Emergency Classification & Transcription Endpoint
app.post("/api/classify-sos", async (req, res) => {
  try {
    const { transcript, audioBase64, mimeType = "audio/webm" } = req.body;

    let finalTranscript = (transcript || "").trim();
    let classifiedCategory = "Other";

    const ai = getGenAI();

    // 1. If transcript is empty but audio base64 is provided, transcribe via Gemini
    if (!finalTranscript && audioBase64 && ai) {
      try {
        const rawBase64 = audioBase64.includes(",") ? audioBase64.split(",")[1] : audioBase64;
        const cleanMime = mimeType.split(";")[0] || "audio/webm";

        const transcribeResponse = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: [
            {
              role: "user",
              parts: [
                {
                  inlineData: {
                    mimeType: cleanMime,
                    data: rawBase64,
                  },
                },
                {
                  text: "Listen to this emergency audio recording and transcribe the spoken words accurately. If there are no recognizable words or only background noise, describe the sound briefly or say 'Emergency voice signal'. Return ONLY the transcription text.",
                },
              ],
            },
          ],
        });

        finalTranscript = (transcribeResponse.text || "").trim();
      } catch (transcribeErr) {
        console.warn("Gemini audio transcription fallback warning:", transcribeErr);
      }
    }

    if (!finalTranscript) {
      finalTranscript = "Emergency voice beacon activated. Immediate ground assistance requested.";
    }

    // 2. Classify emergency category using Gemini
    // Exact requested system instruction:
    // "Classify this emergency message into exactly one category: Flood, Fire, Earthquake, Medical Emergency, Crime/Violence, Building Collapse, Accident, or Other. Respond with only the category name, nothing else."
    const VALID_CATEGORIES = [
      "Flood",
      "Fire",
      "Earthquake",
      "Medical Emergency",
      "Crime/Violence",
      "Building Collapse",
      "Accident",
      "Other",
    ];

    if (ai) {
      try {
        const classificationResponse = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          config: {
            systemInstruction:
              "Classify this emergency message into exactly one category: Flood, Fire, Earthquake, Medical Emergency, Crime/Violence, Building Collapse, Accident, or Other. Respond with only the category name, nothing else.",
            temperature: 0.1,
          },
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Emergency message transcript:\n"${finalTranscript}"`,
                },
              ],
            },
          ],
        });

        const rawCategory = (classificationResponse.text || "").trim();
        // Match exact or nearest valid category
        const matched = VALID_CATEGORIES.find(
          (cat) => cat.toLowerCase() === rawCategory.toLowerCase()
        ) || VALID_CATEGORIES.find((cat) =>
          rawCategory.toLowerCase().includes(cat.toLowerCase())
        );

        if (matched) {
          classifiedCategory = matched;
        } else {
          classifiedCategory = "Other";
        }
      } catch (aiErr) {
        console.warn("Gemini emergency classification error, defaulting to fallback:", aiErr);
        // Heuristic fallback
        const lower = finalTranscript.toLowerCase();
        if (lower.includes("flood") || lower.includes("water") || lower.includes("drown") || lower.includes("submerge")) {
          classifiedCategory = "Flood";
        } else if (lower.includes("fire") || lower.includes("burn") || lower.includes("smoke") || lower.includes("flame")) {
          classifiedCategory = "Fire";
        } else if (lower.includes("quake") || lower.includes("earthquake") || lower.includes("tremor")) {
          classifiedCategory = "Earthquake";
        } else if (lower.includes("heart") || lower.includes("blood") || lower.includes("breath") || lower.includes("doctor") || lower.includes("hospital") || lower.includes("injur") || lower.includes("pain") || lower.includes("medic")) {
          classifiedCategory = "Medical Emergency";
        } else if (lower.includes("attack") || lower.includes("theft") || lower.includes("rob") || lower.includes("gun") || lower.includes("knife") || lower.includes("kill") || lower.includes("threat") || lower.includes("harass")) {
          classifiedCategory = "Crime/Violence";
        } else if (lower.includes("collapse") || lower.includes("building") || lower.includes("debris") || lower.includes("rubble") || lower.includes("trap")) {
          classifiedCategory = "Building Collapse";
        } else if (lower.includes("accident") || lower.includes("crash") || lower.includes("vehicle") || lower.includes("hit")) {
          classifiedCategory = "Accident";
        } else {
          classifiedCategory = "Other";
        }
      }
    } else {
      // Fallback heuristics when Gemini API key is missing
      const lower = finalTranscript.toLowerCase();
      if (lower.includes("flood") || lower.includes("water")) classifiedCategory = "Flood";
      else if (lower.includes("fire") || lower.includes("burn")) classifiedCategory = "Fire";
      else if (lower.includes("quake") || lower.includes("tremor")) classifiedCategory = "Earthquake";
      else if (lower.includes("medical") || lower.includes("doctor") || lower.includes("injur") || lower.includes("hospital")) classifiedCategory = "Medical Emergency";
      else if (lower.includes("crime") || lower.includes("police") || lower.includes("thief") || lower.includes("attack")) classifiedCategory = "Crime/Violence";
      else if (lower.includes("collapse") || lower.includes("building")) classifiedCategory = "Building Collapse";
      else if (lower.includes("accident") || lower.includes("crash")) classifiedCategory = "Accident";
      else classifiedCategory = "Other";
    }

    return res.json({
      success: true,
      category: classifiedCategory,
      transcript: finalTranscript,
    });
  } catch (error: any) {
    console.error("Error in /api/classify-sos:", error);
    return res.json({
      success: false,
      category: "Other",
      transcript: req.body.transcript || "Emergency distress signal",
      error: error.message,
    });
  }
});

// TrahiGPT First-Aid & Emergency Response Chat Endpoint
app.post("/api/trahigpt-chat", async (req, res) => {
  try {
    const { prompt, history = [] } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Missing or invalid prompt string" });
    }

    const ai = getGenAI();

    if (ai) {
      try {
        const systemInstruction = `You are TrahiGPT, an expert AI Emergency Triage & First-Aid Assistant for India.
Your mission is to provide life-saving, panic-resistant, step-by-step first aid protocols, disaster survival instructions, and emergency guidance.
Format your responses cleanly using Markdown:
- Bold crucial action items (e.g. **Step 1: Check for breathing**)
- Use structured bullet points (- item)
- Highlight critical warnings (e.g. > 🚨 **EMERGENCY WARNING**: Do not apply ice directly to burns)
- Mention relevant Indian emergency hotlines when applicable: **112** (National Emergency), **108** (Ambulance), **101** (Fire), **100** (Police).
Keep guidance clear, high-contrast readable, precise, and actionable in low-time/distress situations.`;

        // Format history for Gemini contents
        const contents: any[] = [];
        for (const msg of history.slice(-6)) {
          contents.push({
            role: msg.sender === "user" ? "user" : "model",
            parts: [{ text: msg.text }],
          });
        }
        contents.push({
          role: "user",
          parts: [{ text: prompt }],
        });

        const response = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          config: {
            systemInstruction,
            temperature: 0.3,
          },
          contents,
        });

        const replyText = response.text || "Emergency system active. Please specify your situation.";
        return res.json({
          success: true,
          reply: replyText,
          provider: "gemini-3.7-flash",
        });
      } catch (geminiErr: any) {
        console.warn("Gemini TrahiGPT Chat API call failed, falling back to local protocol engine:", geminiErr?.message || geminiErr);
      }
    }

    // Heuristic Fallback Engine for offline / missing API key scenarios
    const q = prompt.toLowerCase();
    let reply = "";

    if (q.includes("cpr") || q.includes("cardiac") || q.includes("heart attack") || q.includes("breath")) {
      reply = `### 🩺 Emergency CPR & Cardiac Response Protocol

> 🚨 **CALL IMMEDIATELY**: Dial **112** or **108** for an emergency ambulance before starting CPR.

#### **Step-by-Step Hands-Only CPR:**
1. **Position the Victim**: Place the person flat on their back on a firm surface.
2. **Hand Placement**: Place the heel of one hand in the center of their chest (on lower half of breastbone). Lock second hand over the first with fingers interlaced.
3. **Chest Compressions**: Push hard and fast at a rate of **100 to 120 compressions per minute** (matching the rhythm of *"Stayin' Alive"*).
4. **Depth**: Allow the chest to recoil completely between compressions (approx 2 inches or 5 cm deep).
5. **Continue**: Do not stop until professional paramedic assistance arrives or an AED is available.`;
    } else if (q.includes("burn") || q.includes("scald") || q.includes("fire")) {
      reply = `### 🔥 Severe Burn & Scald First-Aid Protocol

> 🚨 **CALL IMMEDIATELY**: Dial **101** (Fire Department) and **108** (Ambulance).

#### **Immediate First-Aid Steps:**
1. **Cool the Burn**: Immediately run clean, cool tap water over the burn for **10 to 20 minutes**.
2. **Protect the Area**: Cover loosely with a sterile non-stick bandage or clean plastic wrap.
3. **Remove Constriction**: Remove rings, watches, or tight clothing near the burn area before swelling starts.

> ⚠️ **CRITICAL WARNINGS**:
> - **DO NOT** use ice, ice water, butter, oil, or toothpaste on burns.
> - **DO NOT** break blisters to prevent severe bacterial infection.`;
    } else if (q.includes("snake") || q.includes("bite") || q.includes("venom")) {
      reply = `### 🐍 Snakebite Emergency Triage (India Protocol)

> 🚨 **EMERGENCY WARNING**: Treat all snakebites in India as potentially venomous (e.g. Cobra, Russell's Viper, Krait, Saw-scaled Viper). Call **108** immediately.

#### **Life-Saving Action Plan:**
1. **Stay Calm & Immobilize**: Keep the victim completely still. Keep the bitten limb **below heart level** to slow venom spread.
2. **Remove Jewelry/Tight Items**: Rings, anklets, and shoes near the bite must be removed before swelling begins.
3. **Clean Lightly**: Wipe wound surface gently with clean water. Cover loosely with sterile cloth.

> ⚠️ **DO NOT DO THE FOLLOWING**:
> - **DO NOT** cut the wound or try to suck out venom.
> - **DO NOT** apply tight tourniquets or ice.
> - **DO NOT** give aspirin or pain relievers that increase bleeding.`;
    } else if (q.includes("bleed") || q.includes("wound") || q.includes("cut") || q.includes("haemorrhage")) {
      reply = `### 🩸 Severe Bleeding Control Protocol

> 🚨 **CALL IMMEDIATELY**: Dial **108** (Ambulance) if blood is spurting or wound is deep.

#### **Direct Pressure Protocol:**
1. **Direct Firm Pressure**: Press a clean cloth or sterile gauze firmly over the bleeding wound using both hands.
2. **Elevate Bitten/Injured Limb**: If possible, raise the bleeding limb above the level of the heart while continuing firm pressure.
3. **Add Layers**: If blood soaks through, do not remove original cloth. Place more cloths directly on top and press harder.
4. **Bandage Securely**: Wrap tightly with a roller bandage to hold pressure.`;
    } else if (q.includes("flood") || q.includes("water") || q.includes("submerge")) {
      reply = `### 🌊 Flash Flood Survival & Rescue Guidance

> 🚨 **NATIONAL DISASTER RESPONSE (NDRF)**: Dial **1078** or **112** for water rescue.

#### **Immediate Survival Steps:**
1. **Move High**: Move immediately to higher ground or upper floors. Avoid basements and low-lying roads.
2. **Avoid Moving Water**: Never walk or drive through flowing water. 6 inches of swift water can sweep a person away.
3. **Turn Off Utilities**: Shut off main electricity switches and gas valves if safe to do so.
4. **Signal Location**: Use a whistle, bright cloth, or flashlight to alert rescue helicopters/boats.`;
    } else {
      reply = `### 🛡️ Trahi First-Aid Triage Guidance

Thank you for reaching out to **TrahiGPT**. I am your dedicated emergency assistant.

#### **Key Disaster & Medical Hotlines in India:**
- 📞 **112**: All-in-One National Emergency Response System
- 🚑 **108**: Medical Emergency & Paramedic Ambulance
- 🚒 **101**: Fire & Rescue Services
- 🚓 **100**: Police Helpline
- 🌊 **1078**: Disaster Management (NDRF)

*Please describe your specific emergency situation (e.g., CPR instructions, burn treatment, snakebite, bleeding control, or earthquake shelter) for step-by-step guidance.*`;
    }

    return res.json({
      success: true,
      reply,
      provider: "local_heuristic_fallback",
    });
  } catch (error: any) {
    console.error("Error in /api/trahigpt-chat:", error);
    return res.status(500).json({ error: error.message || "Failed to process chat query" });
  }
});

// Mount Vite middleware for development / Static files for production
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Trahi Server running on http://0.0.0.0:${PORT}`);
  });
}

setupServer();
