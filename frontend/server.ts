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
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!genAIClient && apiKey) {
    genAIClient = new GoogleGenAI({ apiKey });
  }
  return genAIClient;
}

// Resilient Gemini invocation with automatic model cascading on 503 high-demand / 429 rate limit
async function generateContentWithFallback(
  ai: GoogleGenAI,
  params: {
    systemInstruction?: string;
    temperature?: number;
    responseMimeType?: string;
    contents: any;
    preferredModels?: string[];
  }
): Promise<{ text: string; model: string }> {
  const modelsToTry = params.preferredModels && params.preferredModels.length > 0
    ? params.preferredModels
    : ["gemini-2.5-flash", "gemini-flash-latest", "gemini-3.8-flash"];

  let lastError: any = null;
  for (const model of modelsToTry) {
    try {
      const config: any = {};
      if (params.systemInstruction) config.systemInstruction = params.systemInstruction;
      if (params.temperature !== undefined) config.temperature = params.temperature;
      if (params.responseMimeType) config.responseMimeType = params.responseMimeType;

      const response = await ai.models.generateContent({
        model,
        config: Object.keys(config).length > 0 ? config : undefined,
        contents: params.contents,
      });

      const text = response.text || "";
      return { text, model };
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || JSON.stringify(err);
      console.warn(`Model ${model} attempt yielded (${errMsg.slice(0, 100)}...). Testing next fallback model...`);
      // Brief pause before trying fallback model if 503 or 429
      if (errMsg.includes("503") || errMsg.includes("high demand") || errMsg.includes("429") || errMsg.includes("UNAVAILABLE")) {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }
  }
  throw lastError;
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

        const transcribeResponse = await generateContentWithFallback(ai, {
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
          preferredModels: ["gemini-3.5-transcribe", "gemini-3.8-flash", "gemini-flash-latest"],
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
        const classificationResponse = await generateContentWithFallback(ai, {
          systemInstruction:
            "Classify this emergency message into exactly one category: Flood, Fire, Earthquake, Medical Emergency, Crime/Violence, Building Collapse, Accident, or Other. Respond with only the category name, nothing else.",
          temperature: 0.1,
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
          preferredModels: ["gemini-3.8-flash", "gemini-flash-latest", "gemini-2.5-flash"],
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

    if (!ai) {
      return res.status(503).json({
        success: false,
        errorType: "CONFIG_MISSING",
        message: "TrahiGPT is currently unavailable — the AI service is not configured. Please contact support.",
      });
    }

    try {
      const systemInstruction = `You are TrahiGPT, an expert AI Emergency Triage & First-Aid Assistant for India.
Your mission is to provide life-saving, panic-resistant, step-by-step first aid protocols, disaster survival instructions, and emergency guidance.

CRITICAL INSTRUCTION: You MUST return your response strictly as valid JSON matching this exact structure (no raw markdown wrapper if possible):
{
  "title": "Short descriptive title of protocol or emergency response",
  "summary": "1-2 sentence quick summary of immediate critical action needed",
  "urgency": "critical" | "high" | "moderate" | "info",
  "steps": [
    {
      "stepNumber": 1,
      "title": "Clear step title",
      "description": "Actionable step instruction with bold key terms where appropriate",
      "icon": "phone" | "heart" | "flame" | "shield" | "droplet" | "alert" | "user" | "activity" | "check"
    }
  ],
  "contacts": [
    {
      "name": "Hotline or service name",
      "number": "Phone number e.g. 112, 108, 101, 100, 1078, 1091",
      "category": "Category e.g. National Emergency, Ambulance, Fire, Police, Disaster Response"
    }
  ],
  "stats": [
    {
      "label": "Metric name e.g. Compression Rate",
      "value": "Value e.g. 100-120 / min",
      "subtext": "Subtext context e.g. Rhythm of 'Stayin' Alive'"
    }
  ],
  "warnings": [
    "Critical warning or 'DO NOT' instruction"
  ],
  "notes": "Additional advice or follow-up recommendation"
}

Always populate relevant Indian emergency contacts in the "contacts" array (e.g., 112 National Emergency, 108 Ambulance, 101 Fire, 100 Police, 1078 NDRF).
If a field like "stats" or "warnings" is not applicable, return an empty array [] for it, but always provide "title" and "summary".`;

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

      const response = await generateContentWithFallback(ai, {
        systemInstruction,
        temperature: 0.4,
        responseMimeType: "application/json",
        contents,
        preferredModels: ["gemini-2.5-flash", "gemini-flash-latest", "gemini-3.8-flash"],
      });

      const replyText = response.text || "{}";
      return res.json({
        success: true,
        reply: replyText,
        provider: response.model,
      });
    } catch (geminiErr: any) {
      console.error("Gemini TrahiGPT Chat API call failed:", geminiErr?.message || geminiErr);
      const errMsg = (geminiErr?.message || "").toLowerCase();
      const status = geminiErr?.status || 500;

      if (
        status === 429 ||
        status === 503 ||
        errMsg.includes("429") ||
        errMsg.includes("quota") ||
        errMsg.includes("resource_exhausted") ||
        errMsg.includes("high demand") ||
        errMsg.includes("503") ||
        errMsg.includes("unavailable")
      ) {
        return res.status(429).json({
          success: false,
          errorType: "RATE_LIMIT",
          message: "TrahiGPT is experiencing high demand right now. Please try again in a moment, or use the Emergency Contacts list below for immediate help.",
        });
      }

      return res.status(500).json({
        success: false,
        errorType: "GENERAL_ERROR",
        message: "Something went wrong reaching TrahiGPT. Please check your connection and try again.",
      });
    }
  } catch (error: any) {
    console.error("Error in /api/trahigpt-chat endpoint:", error);
    return res.status(500).json({
      success: false,
      errorType: "GENERAL_ERROR",
      message: "Something went wrong reaching TrahiGPT. Please check your connection and try again.",
    });
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
