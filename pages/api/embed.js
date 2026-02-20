import fs from "fs";
import pdf from "pdf-parse";
import { PDFParse } from "pdf-parse";
import { HfInference } from "@huggingface/inference";
import { QdrantClient } from "@qdrant/js-client-rest";

const hf = new HfInference(process.env.HF_TOKEN);

const client = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

export default async function handler(req, res) {
  try {
    // 1️⃣ Read PDF
    console.log("Step 1: Reading PDF...");
    const buffer = fs.readFileSync("./public/Bhagavad-Gita-Hindi.pdf");
    const uint8Array = new Uint8Array(buffer);
    const data = new PDFParse(uint8Array);
    const result = await data.getText();

    await data.destroy();
    const text = result.text;
    console.log("PDF text extracted successfully:" + text.length);

    // 2️⃣ Chunk text
    console.log("Step 2: Chunking text...");
    const words = text.split(" ");
    const chunkSize = 1000;
    const overlap = 200;
    const chunks = [];

    for (let i = 0; i < words.length; i += chunkSize - overlap) {
      chunks.push(words.slice(i, i + chunkSize).join(" "));
    }

    // 3️⃣ Create collection if not exists
    console.log("Step 3: Creating collection if not exists...");
    try {
      await client.createCollection("gita_collection_hindi", {
        vectors: {
          size: 384,
          distance: "Cosine",
        },
      });
    } catch (e) {
      console.log("Collection may already exist");
    }

    // 4️⃣ Create embeddings (batch)
    console.log("Step 4: Creating embeddings and uploading to Qdrant...");
    const BATCH_SIZE = 32;

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);

      const embeddings = await hf.featureExtraction({
        model: "sentence-transformers/all-MiniLM-L6-v2",
        inputs: batch,
      });

      const points = batch.map((chunk, index) => ({
        id: i + index,
        vector: embeddings[index],
        payload: {
          text: chunk,
          chunk_index: i + index,
        },
      }));

      await client.upsert("gita_collection", {
        wait: true,
        points,
      });
      console.log(`Uploaded ${i + BATCH_SIZE} / ${chunks.length}`);
    }

    // 5️⃣ Delete PDF
    console.log("Step 5: Successfully completed embedding process.");

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to embed PDF" });
  }
}
