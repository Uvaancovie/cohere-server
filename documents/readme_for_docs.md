# How these documents are used by the Chat API
- The Node server reads files in `/documents` and passes them as `documents` to Cohere's Chat endpoint, grounding responses on your business info.
- Keep files short and focused for better retrieval.
- Use `.md` or `.txt` only (in this demo).
- Update anytime; no redeploy needed if the filesystem is the same (on Render’s ephemeral FS you’ll redeploy to change bundled docs).
