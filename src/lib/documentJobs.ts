/**
 * Uses globalThis to store jobs — the ONLY reliable singleton in Next.js.
 * Module-level variables get isolated per-route in dev mode (hot reload).
 * globalThis persists for the entire Node.js process lifetime.
 */

export type DocumentJob = {
  status: "pending" | "generating" | "done" | "error";
  progress: number;
  title: string;
  content?: string;
  description?: string;
  error?: string;
};

// Attach to globalThis so ALL routes share the exact same Map instance
const g = globalThis as any;
if (!g.__documentJobs) {
  g.__documentJobs = new Map<string, DocumentJob>();
}

const documentJobs: Map<string, DocumentJob> = g.__documentJobs;

export default documentJobs;