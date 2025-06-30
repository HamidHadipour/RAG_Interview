const fs = require('fs');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const csv = require('csv-parser');
const OpenAI = require('openai');
const pineconeStore = require('./pineconeStore');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function chunkText(text, size = 700) {
  const chunks = [];
  for (let i = 0; i < text.length; i += size) {
    const chunk = text.slice(i, i + size).trim();
    if (chunk) chunks.push(chunk);
  }
  return chunks;
}

async function parseAndEmbed(filePath, fileName) {
  let text = '';
  if (filePath.endsWith('.pdf')) {
    const data = fs.readFileSync(filePath);
    const parsed = await pdf(data);
    text = parsed.text;
  } else if (filePath.endsWith('.docx')) {
    const result = await mammoth.extractRawText({ path: filePath });
    text = result.value;
  } else if (filePath.endsWith('.csv')) {
    const rows = [];
    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => rows.push(JSON.stringify(row)))
        .on('end', async () => {
          text = rows.join('\n');
          await embedChunks(text);
          resolve();
        })
        .on('error', reject);
    });
  }
  await embedChunks(text);
}

async function embedChunks(text) {
  const chunks = chunkText(text);

  const vectors = [];
  for (const chunk of chunks) {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: chunk
    });

    vectors.push({
      embedding: response.data[0].embedding,
      text: chunk
    });
  }

  await pineconeStore.upsertEmbeddings(vectors);
}

module.exports = parseAndEmbed;
