import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();

//Enable CORS so Firebase frontend can call Render backend
app.use(cors({
  origin: "*",
}));
app.use(express.json());

const systemPrompts = {
  default: process.env.DEFAULT,
  a: process.env.SUMMARY_PROMPT,
  b: process.env.SECTION_WISE_SUMMARY_PROMPT,
  c: process.env.CHATBOT
};
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});
// API endpoint to analyze text
app.post("/analyze", async (req, res) => {
  try {
    const { text, mode } = req.body;

    // Use the selected mode, fallback to default if not valid or missing
    const selectedPrompt = systemPrompts[mode] || systemPrompts.default;

    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: selectedPrompt }] },
          { role: "user", parts: [{ text }] },
        ],
      }),
    });

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";

    res.json({ result: reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI request failed" });
  }
});


// Use Render's dynamic port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});