// Polyfill WebSocket for supabase-js under Node 20 (Next provides one in prod).
import WebSocket from "ws";
const g = globalThis as unknown as { WebSocket?: unknown };
if (!g.WebSocket) g.WebSocket = WebSocket;
