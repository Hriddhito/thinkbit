import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fs from "fs";
// Use the correct import for Vertex AI
import { VertexAI } from '@google-cloud/vertexai';

dotenv.config();

const app = express();

const SERVICE_ACCOUNT_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error("❌ Service account file not found at:", SERVICE_ACCOUNT_PATH);
  process.exit(1);
}

// Initialize Vertex AI
const vertexAI = new VertexAI({
  project: process.env.GOOGLE_PROJECT_ID,
  location: "asia-south1",
});

// Get the generative model
const generativeModel = vertexAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 1024,
  },
});

app.use(cors({
  origin: "https://thinkbit-471218.web.app",
}));

app.use(express.json());

const systemPrompts = {
  default: process.env.DEFAULT,
  a: process.env.SUMMARY_PROMPT,
  b: process.env.SECTION_WISE_SUMMARY_PROMPT,
  c: process.env.CHATBOT,
};

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

app.post("/analyze", async (req, res) => {
  try {
    const { text, mode } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const selectedPrompt = systemPrompts[mode] || systemPrompts.default;
    
    // Construct the full prompt
    const fullPrompt = `${selectedPrompt}\n\nUser Input: ${text}`;

    // Generate content using the correct method
    const result = await generativeModel.generateContent(fullPrompt);
    const response = await result.response;
    const reply = response.text();
    
    res.json({ result: reply });
  } catch (err) {
    console.error("❌ Vertex AI request failed:", err);
    res.status(500).json({ 
      error: "Vertex AI request failed",
      details: err.message 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});