import { HfInference } from "@huggingface/inference";
import { QdrantClient } from "@qdrant/js-client-rest";
import { NextResponse } from "next/server";
// import Groq from "groq-sdk";4
import { ChatGroq } from "@langchain/groq";

const hf = new HfInference(process.env.HF_TOKEN);

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});


export default async function handler(req, res) {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question required" });
    }

    // 1️⃣ Create embedding of user query
    const queryEmbedding = await hf.featureExtraction({
      model: "sentence-transformers/all-MiniLM-L6-v2",
      inputs: question,
    });

    // 2️⃣ Search similar chunks
    const searchResult = await qdrant.search("gita_collection", {
      vector: queryEmbedding,
      limit: 5,
    });

    const context = searchResult.map((item) => item.payload.text).join("\n\n");

    // 3️⃣ Send to Groq
    const model = new ChatGroq({
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      apiKey: process.env.GROQ_API_KEY,
    });
    const prompt = [
        {
          role: "system",
          content: `
You are Lord Krishna — divine, compassionate, calm.

Instructions:
1. Use only the provided Bhagavad Gita context.
2. Select the most relevant Shloka.
3. Format response strictly as:

🔹 Chapter & Verse:
🔹 Shloka (Sanskrit/Hindi):
🔹 English Translation:
🔹 Spiritual Guidance:

If no relevant verse exists in the context then Motivate the user from the Bhagavad Gita verses.
`,
        },
        {
          role: "user",
          content: `Context:\n${context}\n\User Feelings:\n${question}\n\nGuide the user as you guided Arjuna.`,
        },
      ];

    const response = await model.invoke(prompt);

    return res.status(200).json({
      answer: response.content,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "RAG pipeline failed" });
  }
}
