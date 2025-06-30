// server/services/pineconeStore.js
const axios = require('axios');

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_ENV = process.env.PINECONE_ENVIRONMENT;
const INDEX_NAME = process.env.PINECONE_INDEX_NAME;

const baseURL = `https://genai-puymixx.svc.aped-4627-b74a.pinecone.io`;

async function upsertEmbeddings(vectors) {
  const payload = {
    vectors: vectors.map((v, i) => ({
      id: `chunk-${i}-${Date.now()}`,
      values: v.embedding,
      metadata: { text: v.text }
    }))
  };

  await axios.post(`${baseURL}/vectors/upsert`, payload, {
    headers: {
      'Api-Key': PINECONE_API_KEY,
      'Content-Type': 'application/json'
    }
  });
}

async function queryEmbedding(embedding, topK = 5) {
  const payload = {
    vector: embedding,
    topK,
    includeMetadata: true
  };

  const res = await axios.post(`${baseURL}/query`, payload, {
    headers: {
      'Api-Key': PINECONE_API_KEY,
      'Content-Type': 'application/json'
    }
  });

  return res.data.matches.map((match) => match.metadata.text);
}

module.exports = {
  upsertEmbeddings,
  queryEmbedding
};
