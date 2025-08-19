import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CohereClientV2 } from 'cohere-ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Initialize Cohere
const co = new CohereClientV2({ token: process.env.COHERE_API_KEY });

// Load documents function
const DOCS_DIR = path.join(__dirname, 'documents');
function loadDocs() {
  try {
    if (!fs.existsSync(DOCS_DIR)) {
      console.log('Documents directory not found');
      return [];
    }
    
    const files = fs.readdirSync(DOCS_DIR).filter(f => f.endsWith('.txt') || f.endsWith('.md'));
    console.log(`Found ${files.length} document files`);
    
    const documents = files.map(fname => {
      const text = fs.readFileSync(path.join(DOCS_DIR, fname), 'utf8');
      return text; // Return just the text content
    });
    
    return documents;
  } catch (e) { 
    console.error("Error loading docs:", e);
    return []; 
  }
}

// Routes
app.get('/api/health', (req, res) => {
  try {
    const docs = loadDocs();
    res.json({ 
      status: 'healthy',
      documentsFound: docs.length,
      timestamp: new Date().toISOString(),
      apiKeyConfigured: !!process.env.COHERE_API_KEY
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    console.log('Received chat request:', req.body);
    
    const { message, conversationId } = req.body || {};
    
    if (!message) {
      return res.status(400).json({ error: 'Missing message in request body' });
    }

    console.log(`Processing message: "${message.substring(0, 50)}..."`);
    
    // Load documents
    const documents = loadDocs();
    console.log(`Using ${documents.length} documents for context`);
    
    // Call Cohere API
    const response = await co.chat({
      model: 'command-r',
      messages: [{ role: 'user', content: message }],
      documents: documents.slice(0, 5), // Use up to 5 documents
      conversationId: conversationId || undefined
    });
    
    // Extract response
    const msg = response?.message;
    let reply = '';
    if (msg?.content && Array.isArray(msg.content)) {
      const textPart = msg.content.find(p => p.type === 'text');
      reply = textPart?.text || '';
    }
    
    const result = {
      success: true,
      reply: reply || 'No response generated',
      meta: {
        model: 'command-r',
        documentsUsed: Math.min(documents.length, 5),
        conversationId: response?.conversationId || null
      }
    };
    
    console.log('Chat response generated successfully');
    res.json(result);
    
  } catch (err) {
    console.error('Chat endpoint error:', err);
    res.status(500).json({ 
      success: false,
      error: err?.message || 'Server error',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 Documents loaded: ${loadDocs().length} files`);
  console.log(`🔑 API Key: ${process.env.COHERE_API_KEY ? 'Configured' : 'Missing'}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`💬 Chat endpoint: http://localhost:${PORT}/api/chat`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});