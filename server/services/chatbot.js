const { queryEmbedding, upsertEmbeddings } = require('./pineconeStore');
const { getEmbedding } = require('./embedding');
const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to query Pinecone for relevant context
async function queryChroma(query) {
  try {
    // Check if we have the required API keys
    if (!process.env.OPENAI_API_KEY) {
      return "Document processing is not available. Please configure API keys.";
    }

    // Get embedding for the query
    const queryEmbeddingVector = await getEmbedding(query);

    // Query Pinecone for similar documents
    const relevantTexts = await queryEmbedding(queryEmbeddingVector, 5);

    // Combine relevant texts into context
    const context = relevantTexts.join('\n\n');

    return context || "No relevant context found.";
  } catch (error) {
    console.error('Error querying Chroma:', error);
    return "Error retrieving context from documents. The document may not have been processed yet.";
  }
}

// Function to get AI response using OpenAI
async function askLLM(question, context) {
  try {
    const prompt = `You are a domain-specific assistant. Use the context below to answer the user's question.
- If context contains conflicting statements or ambiguity (e.g., two people with the same name), ask the user to clarify.
- If the answer cannot be found in the context, say so.

Context:
${context}

Question: ${question}

Answer:`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `
          You are a helpful assistant answering questions based only on the provided sources.
          - If context has ambiguity (e.g., two people with the same name), ask for clarification.
          - Do not guess. If no answer is found, say so clearly.
          - Keep answers factual, concise, and professional.
            `.trim(),
        
        
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error asking LLM:', error);
    return "I'm sorry, I encountered an error while processing your question. Please try again.";
  }
}

module.exports = { queryChroma, askLLM };
