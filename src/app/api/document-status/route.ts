import documentJobs from "@/lib/documentJobs";

export async function GET(req: Request) {
  const jobId = new URL(req.url).searchParams.get("jobId");

  if (!jobId) {
    return Response.json({ error: "Missing jobId" }, { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: object) => {
        try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`)); } catch {}
      };

      // Wait up to 2s for job to appear (it's registered just before this SSE connects)
      let waited = 0;
      const interval = setInterval(() => {
        const job = documentJobs.get(jobId);

        if (!job) {
          waited += 400;
          if (waited >= 2000) {
            send({ status: "error", error: "Job not found" });
            clearInterval(interval);
            controller.close();
          }
          return; // keep waiting
        }

        send({
          jobId,
          status: job.status,
          progress: job.progress,
          title: job.title,
          ...(job.status === "done"  ? { content: job.content, description: job.description } : {}),
          ...(job.status === "error" ? { error: job.error } : {}),
        });

        if (job.status === "done" || job.status === "error") {
          clearInterval(interval);
          setTimeout(() => {
            try { controller.close(); } catch {}
            documentJobs.delete(jobId);
          }, 500);
        }
      }, 400);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}