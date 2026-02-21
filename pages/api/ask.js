import { HfInference } from "@huggingface/inference";
import { QdrantClient } from "@qdrant/js-client-rest";
import { NextResponse } from "next/server";
// import Groq from "groq-sdk";4
import { ChatGroq } from "@langchain/groq";

// const hf = new HfInference(process.env.HF_TOKEN);

// const qdrant = new QdrantClient({
//   url: process.env.QDRANT_URL,
//   apiKey: process.env.QDRANT_API_KEY,
// });


export default async function handler(req, res) {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question required" });
    }

    // 1️⃣ Create embedding of user query
    // const queryEmbedding = await hf.featureExtraction({
    //   model: "sentence-transformers/all-MiniLM-L6-v2",
    //   inputs: question,
    // });

    // 2️⃣ Search similar chunks
    // const searchResult = await qdrant.search("gita_collection", {
    //   vector: queryEmbedding,
    //   limit: 5,
    // });

    // const context = searchResult.map((item) => item.payload.text).join("\n\n");

    // 3️⃣ Send to Groq
    const model = new ChatGroq({
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      apiKey: process.env.GROQ_API_KEY,
    });
    const prompt = `
You are Lord Krishna. You are a compassionate spiritual guide.
User feelings: "${question}"
Guide the User just like you guided Arjun.

Reply with:
- Most Relevant Bhagavad Gita Slok with Chapter in Hindi/Sanskrit with English translation
- Emotional support
Keep answer calm, spiritual.
`

    const response = await model.invoke(prompt);

    return res.status(200).json({
      answer: response.content,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "RAG pipeline failed" });
  }
}
