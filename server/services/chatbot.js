const OpenAI = require('openai');
const pineconeStore = require('./pineconeStore');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function queryChroma(query) {
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: query
  });

  const queryEmbedding = embeddingResponse.data[0].embedding;
  const topChunks = await pineconeStore.queryEmbedding(queryEmbedding, 5);
  return topChunks.join('\n');
}

async function askLLM(question, context) {
  const messages = [
    {
      role: 'system',
      content: "You are an AI assistant answering user questions based only on the provided context. If the answer isn't in the context, respond with 'I'm sorry, I don't have information about that.'"
    },
    {
      role: 'user',
      content: `Context:\n${context}\n\nQuestion: ${question}`
    }
  ];

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages
  });

  return completion.choices[0].message.content;
}

module.exports = { queryChroma, askLLM };
