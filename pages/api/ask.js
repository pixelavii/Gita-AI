import { HfInference } from "@huggingface/inference";
import { QdrantClient } from "@qdrant/js-client-rest";
import Groq from "groq-sdk";

const hf = new HfInference(process.env.HF_TOKEN);

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
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

    const context = searchResult
      .map((item) => item.payload.text)
      .join("\n\n");

    // 3️⃣ Send to Groq
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            `
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
      ],
      temperature: 0.7,
    });

    const answer = completion.choices[0].message.content;

    res.status(200).json({
      answer,
      sources: searchResult.map((r) => r.payload.chunk_index),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "RAG pipeline failed" });
  }
}
