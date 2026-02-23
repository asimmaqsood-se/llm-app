/**
 * Global job store — lives outside React, survives re-renders and component unmounts.
 * SSE connections are managed here so they never get killed by React lifecycle.
 */

type JobStatus = 
  | { phase: "generating"; progress: number }
  | { phase: "done"; title: string; content: string; description?: string }
  | { phase: "error"; error: string };

type Listener = (status: JobStatus) => void;

class JobStore {
  private jobs = new Map<string, JobStatus>();
  private listeners = new Map<string, Set<Listener>>();
  private connections = new Map<string, EventSource>();

  // Subscribe to job updates — returns unsubscribe fn
  subscribe(jobId: string, listener: Listener): () => void {
    if (!this.listeners.has(jobId)) {
      this.listeners.set(jobId, new Set());
    }
    this.listeners.get(jobId)!.add(listener);

    // If job already has a status, emit it immediately
    const current = this.jobs.get(jobId);
    if (current) listener(current);

    return () => {
      this.listeners.get(jobId)?.delete(listener);
    };
  }

  // Start watching a jobId via SSE — idempotent, won't double-connect
  watch(jobId: string) {
    if (this.connections.has(jobId)) return; // already watching

    const es = new EventSource(`/api/document-status?jobId=${jobId}`);
    this.connections.set(jobId, es);

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      let status: JobStatus;

      if (data.status === "done") {
        status = { phase: "done", title: data.title, content: data.content, description: data.description };
        es.close();
        this.connections.delete(jobId);
      } else if (data.status === "error") {
        status = { phase: "error", error: data.error ?? "Unknown error" };
        es.close();
        this.connections.delete(jobId);
      } else {
        status = { phase: "generating", progress: data.progress ?? 0 };
      }

      this.jobs.set(jobId, status);
      this.listeners.get(jobId)?.forEach(fn => fn(status));
    };

    es.onerror = () => {
      const status: JobStatus = { phase: "error", error: "Connection lost" };
      this.jobs.set(jobId, status);
      this.listeners.get(jobId)?.forEach(fn => fn(status));
      es.close();
      this.connections.delete(jobId);
    };
  }

  getStatus(jobId: string): JobStatus | null {
    return this.jobs.get(jobId) ?? null;
  }
}

// Singleton — one instance for the entire app lifetime
export const jobStore = new JobStore();