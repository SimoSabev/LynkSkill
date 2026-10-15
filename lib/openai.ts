import OpenAI from 'openai';

// Single shared client. The key comes from the environment only
// (Vercel project env / .env.local via Next's loader).
// Routes check process.env.OPENAI_API_KEY before calling and return a 500
// with a clear message; we do not throw at import time so a missing key
// can't break unrelated builds/routes.
export const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY ?? "missing",
    timeout: 60_000,
});

export const isOpenAIConfigured = () => Boolean(process.env.OPENAI_API_KEY);
