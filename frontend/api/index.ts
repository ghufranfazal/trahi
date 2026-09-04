import express from "express";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { v2 as cloudinary } from "cloudinary";

dotenv.config();

const app = express();

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Lazy-initialized Gemini API client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!genAIClient && key) {
    genAIClient = new GoogleGenAI({ apiKey: key });
  }
  return genAIClient;
}

// 1. Health Endpoint
app.get(["/api/health", "/health"], (req, res) => {
  res.json({
    status: "ok",
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// 2. Audio Upload Endpoint
app.post(["/api/upload-audio", "/upload-audio"], async (req, res) => {
  try {
    const { audioData, mimeType = "audio/webm" } = req.body;
    if (!audioData) {
      return res.status(400).json({ error: "Missing audioData in request body" });
    }

    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      try {
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
          secure: true,
        });

        const uploadResult = await cloudinary.uploader.upload(audioData, {
          resource_type: "video",
          folder: "trahi_sos_audio",
          public_id: `sos_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        });

        return res.json({
          success: true,
          url: uploadResult.secure_url || uploadResult.url,
          provider: "cloudinary",
        });
      } catch (cloudErr: any) {
        console.warn("Cloudinary upload failed, falling back to data URL:", cloudErr?.message || cloudErr);
      }
    }

    return res.json({
      success: true,
      url: audioData.startsWith("data:") ? audioData : `data:${mimeType};base64,${audioData}`,
      provider: "data_uri_fallback",
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to process audio" });
  }
});

// 3. Classify SOS Endpoint
app.post(["/api/classify-sos", "/classify-sos"], async (req, res) => {
  try {
    const { transcript, audioBase64, mimeType = "audio/webm" } = req.body;
    let finalTranscript = (transcript || "").trim();
    let classifiedCategory = "Other";

    const ai = getGenAI();
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
                { inlineData: { mimeType: cleanMime, data: rawBase64 } },
                { text: "Listen to this emergency audio recording and transcribe the spoken words accurately. Return ONLY the transcription text." },
              ],
            },
          ],
        });
        finalTranscript = (transcribeResponse.text || "").trim();
      } catch (err) {
        console.warn("Gemini transcription fallback warning:", err);
      }
    }

    if (!finalTranscript) {
      finalTranscript = "Emergency voice beacon activated. Immediate ground assistance requested.";
    }

    if (ai) {
      try {
        const classificationResponse = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          config: {
            systemInstruction: "Classify this emergency message into exactly one category: Flood, Fire, Earthquake, Medical Emergency, Crime/Violence, Building Collapse, Accident, or Other. Respond with only the category name, nothing else.",
            temperature: 0.1,
          },
          contents: [{ role: "user", parts: [{ text: `Emergency message transcript:\n"${finalTranscript}"` }] }],
        });
        classifiedCategory = (classificationResponse.text || "").trim() || "Other";
      } catch (e) {
        classifiedCategory = "Other";
      }
    }

    return res.json({ success: true, category: classifiedCategory, transcript: finalTranscript });
  } catch (error: any) {
    return res.json({ success: false, category: "Other", transcript: req.body.transcript || "Emergency distress signal", error: error.message });
  }
});

// 4. TrahiGPT Chat Endpoint
app.post(["/api/trahigpt/chat", "/api/trahigpt-chat", "/trahigpt/chat", "/trahigpt-chat"], async (req, res) => {
  try {
    const { prompt, history = [] } = req.body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ success: false, error: "Missing or invalid prompt string" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: "GEMINI_API_KEY is not configured in backend environment file (.env).",
      });
    }

    const ai = getGenAI();
    if (!ai) {
      return res.status(500).json({
        success: false,
        error: "Failed to initialize Gemini AI client.",
      });
    }

    const systemInstruction = `You are TrahiGPT, an expert AI Emergency Triage & First-Aid Assistant for India.
Your mission is to provide life-saving, panic-resistant, step-by-step first aid protocols, disaster survival instructions, and emergency guidance.
Format your responses cleanly using Markdown:
- Bold crucial action items (e.g. **Step 1: Check for breathing**)
- Use structured bullet points (- item)
- Highlight critical warnings (e.g. > 🚨 **EMERGENCY WARNING**: Do not apply ice directly to burns)
- Mention relevant Indian emergency hotlines when applicable: **112** (National Emergency), **108** (Ambulance), **101** (Fire), **100** (Police).
Keep guidance clear, high-contrast readable, precise, and actionable in low-time/distress situations. Answer all questions dynamically based on the exact situation described.`;

    const contents: any[] = [];
    if (Array.isArray(history)) {
      for (const msg of history.slice(-10)) {
        if (msg && msg.text && typeof msg.text === "string") {
          contents.push({
            role: msg.sender === "user" ? "user" : "model",
            parts: [{ text: msg.text }],
          });
        }
      }
    }

    contents.push({
      role: "user",
      parts: [{ text: prompt.trim() }],
    });

    const modelsToTry = [
      "gemini-2.5-flash",
      "gemini-1.5-flash",
      "gemini-2.0-flash",
      "gemini-3.7-flash",
    ];

    let replyText = "";
    let lastError: any = null;
    let successfulModel = "";

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          config: { systemInstruction, temperature: 0.3 },
          contents,
        });

        replyText = (response.text || "").trim();
        if (replyText) {
          successfulModel = modelName;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} call failed/unavailable, trying next model...`, err?.message || err);
      }
    }

    if (!replyText) {
      let errorMsg = lastError?.message || "Failed to generate AI response from Gemini API.";
      try {
        if (typeof errorMsg === "string" && errorMsg.includes("{")) {
          const parsed = JSON.parse(errorMsg.substring(errorMsg.indexOf("{")));
          if (parsed?.error?.message) {
            errorMsg = parsed.error.message;
          }
        }
      } catch (e) {}

      return res.status(500).json({ success: false, error: errorMsg });
    }

    return res.json({
      success: true,
      reply: replyText,
      provider: successfulModel,
    });
  } catch (error: any) {
    console.error("Error in /api/trahigpt/chat:", error?.message || error);
    return res.status(500).json({
      success: false,
      error: error?.message || "Failed to process chat query via Gemini API.",
    });
  }
});

export default app;
