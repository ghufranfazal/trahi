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
