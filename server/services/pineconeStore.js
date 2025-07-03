// server/services/pineconeStore.js
const axios = require('axios');

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_ENV = process.env.PINECONE_ENVIRONMENT;
const INDEX_NAME = process.env.PINECONE_INDEX_NAME;

const baseURL = `https://ragtest-puymixx.svc.aped-4627-b74a.pinecone.io`;

async function upsertEmbeddings(vectors) {
  try {
    // Limit batch size to prevent API issues
    const maxBatchSize = 10;
    const batches = [];

    for (let i = 0; i < vectors.length; i += maxBatchSize) {
      batches.push(vectors.slice(i, i + maxBatchSize));
    }

    console.log(`Splitting ${vectors.length} vectors into ${batches.length} batches`);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const payload = {
        vectors: batch.map((v, index) => ({
          id: `chunk-${Date.now()}-${i}-${index}`,
          values: v.embedding,
          metadata: { text: v.text }
        }))
      };

      console.log(`Upserting batch ${i + 1}/${batches.length} with ${batch.length} vectors`);

      await axios.post(`${baseURL}/vectors/upsert`, payload, {
        headers: {
          'Api-Key': PINECONE_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      });

      // Add delay between batches to avoid rate limiting
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`Successfully upserted ${vectors.length} vectors`);

  } catch (error) {
    console.error('Error upserting embeddings:', error.response?.data || error.message);
    throw error;
  }
}

async function queryEmbedding(embedding, topK = 5) {
  try {
    const payload = {
      vector: embedding,
      topK,
      includeMetadata: true
    };

    const res = await axios.post(`${baseURL}/query`, payload, {
      headers: {
        'Api-Key': PINECONE_API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });

    return res.data.matches.map((match) => match.metadata.text);
  } catch (error) {
    console.error('Error querying embeddings:', error.response?.data || error.message);
    return [];
  }
}

module.exports = {
  upsertEmbeddings,
  queryEmbedding
};
