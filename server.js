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
app.use(cors());
app.use(express.json({ limit: '2mb' }));


const co = new CohereClientV2({ token: process.env.COHERE_API_KEY });


// --- Load your local docs as context (not training) ---
// Put .txt/.md files in ./documents. (PDF requires extra parsing libs.)
const DOCS_DIR = path.join(__dirname, 'documents');
function loadDocs() {
try {
if (!fs.existsSync(DOCS_DIR)) return [];
const files = fs.readdirSync(DOCS_DIR).filter(f => f.endsWith('.txt') || f.endsWith('.md'));
return files.map(fname => {
const text = fs.readFileSync(path.join(DOCS_DIR, fname), 'utf8');
// Cohere expects docs as JSON objects with strings; main text under `text`
return { id: fname, title: fname, text };
});
} catch (e) { return []; }
}


app.get('/api/health', (_req, res) => res.json({ ok: true }));


// Chat endpoint
app.post('/api/chat', async (req, res) => {
try {
const { message, conversationId, topK = 6 } = req.body || {};
if (!message) return res.status(400).json({ error: 'Missing `message`' });


const documents = loadDocs();


const response = await co.chat({
// Cohere published model (Aug 2025): adjust if needed
model: 'command-a-03-2025',
messages: [ { role: 'user', content: message } ],
// Provide local docs as grounding context
documents: documents.slice(0, topK),
// Keeping the API simple for demo; you can stream too if needed
conversationId: conversationId || undefined
});


// Extract assistant text (per v2 response structure)
const msg = response?.message;
let reply = '';
if (msg?.content && Array.isArray(msg.content)) {
const textPart = msg.content.find(p => p.type === 'text');
reply = textPart?.text || '';
}


return res.json({
reply: reply || '[no text returned]',
meta: {
model: response?.meta?.model || 'command-a-03-2025',
usage: response?.meta?.tokens || null,
docsUsed: documents.length
}
});
} catch (err) {
console.error(err);
return res.status(500).json({ error: err?.message || 'Server error' });
}
app.listen(PORT, () => console.log(`API listening on :${PORT}`));