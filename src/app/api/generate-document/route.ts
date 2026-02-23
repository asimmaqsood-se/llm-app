import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { generateText } from "ai";
import documentJobs from "@/lib/documentJobs";

const bedrock = createAmazonBedrock({
  region: process.env.AWS_REGION || "us-east-1",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const MODEL = "anthropic.claude-3-5-sonnet-20240620-v1:0";

export async function generateDocumentInBackground(
  jobId: string,
  title: string,
  description: string | undefined,
  prompt: string,
  conversationContext: string
) {
  const job = documentJobs.get(jobId)!;

  try {
    job.status = "generating";
    job.progress = 10;
    await new Promise(r => setTimeout(r, 500));
    job.progress = 25;
    await new Promise(r => setTimeout(r, 500));
    job.progress = 40;

    const result = await generateText({
      model: bedrock(MODEL),
      system: "You are a document writer. Generate complete, well-structured Markdown documents. Return ONLY the Markdown content — no preamble, no explanation, just the document.",
      prompt: `Write a complete Markdown document titled: "${title}".
${description ? `Description: ${description}` : ""}
${conversationContext ? `Context: ${conversationContext}` : ""}
${prompt ? `Instructions: ${prompt}` : ""}

Return the full document in Markdown starting with # ${title}`,
    });

    job.progress = 85;
    await new Promise(r => setTimeout(r, 300));
    job.progress = 100;
    job.content = result.text;
    job.status = "done";

  } catch (err) {
    job.status = "error";
    job.error = err instanceof Error ? err.message : "Unknown error";
    console.error("[generate-document] error:", err);
  }
}

export async function POST(req: Request) {
  const { jobId, title, description, prompt, conversationContext } = await req.json();
  if (!jobId || !title) return Response.json({ error: "Missing jobId or title" }, { status: 400 });
  documentJobs.set(jobId, { status: "pending", progress: 0, title, description });
  generateDocumentInBackground(jobId, title, description, prompt, conversationContext);
  return Response.json({ jobId, status: "pending" });
}