const fs = require('fs');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const csv = require('csv-parser');
const OpenAI = require('openai');
const { upsertEmbeddings } = require('./pineconeStore');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to get embeddings from OpenAI
async function getEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error getting embedding:', error);
    throw error;
  }
}

// Function to split text into very small chunks
function splitTextIntoChunks(text, chunkSize = 200, overlap = 25) {
  // Add a maximum text length limit to prevent memory issues
  const maxTextLength = 100000; // 100KB limit
  if (text.length > maxTextLength) {
    console.log(`Text too long (${text.length} chars), truncating to ${maxTextLength} characters`);
    text = text.substring(0, maxTextLength);
  }
  
  const chunks = [];
  let start = 0;
  
  // Limit the number of chunks to prevent memory issues
  const maxChunks = 100;
  
  while (start < text.length && chunks.length < maxChunks) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end);
    chunks.push(chunk);
    start = end - overlap;
  }
  
  console.log(`Split text into ${chunks.length} chunks (max ${maxChunks})`);
  return chunks;
}

// Memory-efficient file processing with strict limits
async function parseAndEmbed(filePath, fileName) {
  try {
    console.log(`Starting to process file: ${fileName}`);
    
    // Check if we have the required API keys
    if (!process.env.OPENAI_API_KEY) {
      console.log('OpenAI API key not found. Skipping embedding generation.');
      return Promise.resolve();
    }
    
    // Check file size - reject files larger than 5MB
    const stats = fs.statSync(filePath);
    const fileSizeMB = stats.size / (1024 * 1024);
    if (fileSizeMB > 5) {
      console.log(`File too large (${fileSizeMB.toFixed(2)}MB). Skipping embedding generation.`);
      return Promise.resolve();
    }
    
    if (filePath.endsWith('.pdf')) {
      await processPDFFile(filePath, fileName);
    } else if (filePath.endsWith('.docx')) {
      await processDOCXFile(filePath, fileName);
    } else if (filePath.endsWith('.csv')) {
      await processCSVFile(filePath, fileName);
    } else {
      await processTextFile(filePath, fileName);
    }
    
    console.log(`Completed processing file: ${fileName}`);
    return Promise.resolve();
    
  } catch (error) {
    console.error('Error processing file:', error);
    
    // If it's a memory error, log it but don't crash
    if (error.message && (error.message.includes('heap') || error.message.includes('memory'))) {
      console.log('Memory error detected. Skipping embedding generation to allow upload to complete.');
      return Promise.resolve();
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    throw error;
  }
}

// Process PDF files with strict limits
async function processPDFFile(filePath, fileName) {
  console.log(`Processing PDF: ${fileName}`);
  
  // Read file
  let fileBuffer = fs.readFileSync(filePath);
  console.log(`PDF file size: ${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB`);
  
  // Parse PDF
  const parsed = await pdf(fileBuffer);
  const text = parsed.text;
  
  console.log(`Extracted ${text.length} characters from PDF`);
  
  // Clear the buffer from memory
  fileBuffer = null;
  
  // Limit text length to prevent memory issues
  const maxTextLength = 50000; // 50KB limit
  const limitedText = text.length > maxTextLength ? text.substring(0, maxTextLength) : text;
  
  if (text.length > maxTextLength) {
    console.log(`Text truncated from ${text.length} to ${limitedText.length} characters`);
  }
  
  // Process text with strict limits
  await processTextWithLimits(limitedText, fileName);
}

// Process DOCX files with limits
async function processDOCXFile(filePath, fileName) {
  console.log(`Processing DOCX: ${fileName}`);
  
  const result = await mammoth.extractRawText({ path: filePath });
  const text = result.value;
  
  console.log(`Extracted ${text.length} characters from DOCX`);
  
  // Limit text length
  const maxTextLength = 50000;
  const limitedText = text.length > maxTextLength ? text.substring(0, maxTextLength) : text;
  
  if (text.length > maxTextLength) {
    console.log(`Text truncated from ${text.length} to ${limitedText.length} characters`);
  }
  
  await processTextWithLimits(limitedText, fileName);
}

// Process CSV files with strict limits
async function processCSVFile(filePath, fileName) {
  console.log(`Processing CSV: ${fileName}`);
  
  // Check file size before processing
  try {
    const stats = fs.statSync(filePath);
    const fileSizeKB = stats.size / 1024;
    console.log(`CSV file size: ${fileSizeKB.toFixed(2)}KB`);
    
    // Skip processing if file is too large
    if (fileSizeKB > 100) { // 100KB limit for CSV
      console.log(`CSV file too large (${fileSizeKB.toFixed(2)}KB). Skipping embedding generation.`);
      return Promise.resolve();
    }
  } catch (error) {
    console.error('Error checking CSV file size:', error);
    return Promise.resolve();
  }
  
  return new Promise((resolve, reject) => {
    try {
    const chunks = [];
    let rowCount = 0;
    const maxRows = 100; // Reduced from 1000 to 100 rows
    const maxTextLength = 50000; // 50KB limit like other file types
    let currentText = '';
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        if (rowCount >= maxRows) {
          return; // Skip additional rows
        }
        
        // Convert row to a simple string format instead of JSON.stringify
        const rowText = Object.entries(row)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
        
        // Check if adding this row would exceed the text limit
        if (currentText.length + rowText.length + 1 > maxTextLength) {
          console.log(`CSV text limit reached at ${rowCount} rows. Stopping processing.`);
          return;
        }
        
        currentText += (currentText ? '\n' : '') + rowText;
        rowCount++;
      })
      .on('end', async () => {
        console.log(`Processed CSV file: ${fileName} (${rowCount} rows, ${currentText.length} characters)`);
        
        if (currentText.length > 0) {
          await processTextWithLimits(currentText, fileName);
        }
        resolve();
      })
              .on('error', (error) => {
          console.error('CSV processing error:', error);
          reject(error);
        });
    } catch (error) {
      console.error('CSV processing error:', error);
      reject(error);
    }
  });
}

// Process text files with limits
async function processTextFile(filePath, fileName) {
  console.log(`Processing text file: ${fileName}`);
  
  const text = fs.readFileSync(filePath, 'utf8');
  console.log(`Extracted ${text.length} characters from text file`);
  
  // Limit text length
  const maxTextLength = 50000;
  const limitedText = text.length > maxTextLength ? text.substring(0, maxTextLength) : text;
  
  if (text.length > maxTextLength) {
    console.log(`Text truncated from ${text.length} to ${limitedText.length} characters`);
  }
  
  await processTextWithLimits(limitedText, fileName);
}

// Process text with strict limits to prevent memory issues
async function processTextWithLimits(text, fileName) {
  try {
    // Split text into very small chunks
    const chunks = splitTextIntoChunks(text);
    console.log(`Split text into ${chunks.length} chunks for ${fileName}`);
    
    // Limit total number of chunks to prevent memory issues
    const maxChunks = 20; // Reduced from 50 to 20 chunks per file
    const limitedChunks = chunks.slice(0, maxChunks);
    
    if (chunks.length > maxChunks) {
      console.log(`Limited chunks from ${chunks.length} to ${limitedChunks.length}`);
    }
    
    // Process chunks one by one to minimize memory usage
    const batchSize = 2; // Very small batch size
    let processedCount = 0;
    
    for (let i = 0; i < limitedChunks.length; i += batchSize) {
      const batch = limitedChunks.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(limitedChunks.length/batchSize)} for ${fileName}`);
      
      // Process batch sequentially
      const vectors = [];
      for (let j = 0; j < batch.length; j++) {
        const chunk = batch[j];
        const globalIndex = i + j;
        
        try {
          const embedding = await getEmbedding(chunk);
          vectors.push({
            embedding: embedding,
            text: chunk,
            metadata: {
              fileName: fileName,
              chunkIndex: globalIndex,
              totalChunks: limitedChunks.length
            }
          });
          processedCount++;
        } catch (error) {
          console.error(`Error embedding chunk ${globalIndex}:`, error);
        }
        
        // Delay between chunks
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Store this batch immediately
      if (vectors.length > 0) {
        try {
          await upsertEmbeddings(vectors);
          console.log(`Stored batch ${Math.floor(i/batchSize) + 1} (${vectors.length} embeddings) for ${fileName}`);
        } catch (error) {
          console.error('Error storing embeddings:', error);
          // Continue processing even if storage fails
        }
      }
      
      // Clear vectors from memory
      vectors.length = 0;
      
      // Force garbage collection
      if (global.gc) {
        global.gc();
      }
      
      // Longer delay between batches
      if (i + batchSize < limitedChunks.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`Successfully processed ${processedCount} chunks for ${fileName}`);
    
  } catch (error) {
    console.error('Error processing text with limits:', error);
    throw error;
  }
}

module.exports = { parseAndEmbed, getEmbedding };
