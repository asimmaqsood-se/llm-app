import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import {
  streamText,
  tool,
  convertToModelMessages,
  UIMessage,
  stepCountIs,
} from "ai";
import { z } from "zod";
import { randomUUID } from "crypto";
import documentJobs from "@/lib/documentJobs";
import { generateDocumentInBackground } from "@/app/api/generate-document/route";

const MODEL = "anthropic.claude-3-5-sonnet-20240620-v1:0";

const bedrock = createAmazonBedrock({
  region: process.env.AWS_REGION || "us-east-1",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are a helpful AI assistant similar to Claude.

Don't write explanation for tools.Just write here is result which you want. 

CHART CREATION:
When users ask to visualize data, create charts, or see trends:
  1. Generate appropriate sample data or use provided data
  2. Call create_chart with the data and configuration
  3. Choose the right chart type:
     - bar: Compare categories, show distributions
     - line: Show trends over time
     - pie: Show proportions/percentages
     - area: Show cumulative trends


DOCUMENT CREATION — ASYNC TWO-CALL FLOW:
When a user asks to create/write/draft any document:
  STEP 1: Write a SHORT reply (2-3 sentences) telling the user what you are creating.
  STEP 2: Call "queue_document" with the title, a description, and a detailed prompt describing what to write.
          DO NOT write the full content yourself — the prompt field tells the background job what to generate.
          The queue_document tool returns a jobId instantly. The actual document generates in the background.
          The user will be notified automatically when it is ready.

For EDITING: call queue_document with action "update" and include the documentId.

PROFILE COLLECTION:
When you receive a collect_user_profile result, write a brief acknowledgement, then call queue_document.

PARALLEL RESEARCH:
When asked to research — call web_search, fetch_data, AND read_knowledge_base simultaneously.

TOOLS:
1. weather — current weather
2. arithmetic — math
3. queue_document — async document creation (text reply first, then this)
4. collect_user_profile — collect user info via form
5. web_search / fetch_data / read_knowledge_base — parallel research`;

function lastToolResultIsProfile(messages: UIMessage[]): boolean {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role === "assistant") {
      const parts = (msg as any).parts ?? [];
      for (const part of parts) {
        if (
          part.type === "tool-invocation" &&
          part.toolInvocation?.toolName === "collect_user_profile" &&
          part.toolInvocation?.state === "result"
        )
          return true;
      }
    }
  }
  return false;
}

// Extract last few user/assistant messages as context for the background LLM call
function extractConversationContext(messages: UIMessage[]): string {
  const recent = messages.slice(-6);
  return recent
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => {
      const textParts =
        (m as any).parts?.filter((p: any) => p.type === "text") ?? [];
      const text = textParts
        .map((p: any) => p.text)
        .join(" ")
        .slice(0, 300);
      return text ? `${m.role}: ${text}` : null;
    })
    .filter(Boolean)
    .join("\n");
}

export async function POST(req: Request) {
  const { messages, system }: { messages: UIMessage[]; system?: string } =
    await req.json();
  const modelMessages = await convertToModelMessages(messages);
  const justGotProfile = lastToolResultIsProfile(messages);
  const conversationContext = extractConversationContext(messages);

  const result = streamText({
    model: bedrock(MODEL),
    system: system ?? SYSTEM_PROMPT,
    messages: modelMessages,
    stopWhen: stepCountIs(5),
    ...(justGotProfile
      ? { toolChoice: { type: "tool", toolName: "queue_document" } }
      : {}),
    tools: {
      weather: tool({
        description: "Get the current weather for a specific location",
        inputSchema: z.object({
          location: z.string(),
          unit: z.enum(["celsius", "fahrenheit"]).optional(),
        }),
        execute: async ({ location, unit = "celsius" }) => {
          const conditions = [
            "Sunny",
            "Partly Cloudy",
            "Overcast",
            "Light Rain",
            "Heavy Rain",
            "Thunderstorm",
            "Snow",
            "Foggy",
            "Windy",
            "Clear",
          ];
          const condition =
            conditions[Math.floor(Math.random() * conditions.length)];
          const tempC = Math.round(Math.random() * 35 - 5);
          const temp =
            unit === "fahrenheit" ? Math.round((tempC * 9) / 5 + 32) : tempC;
          return {
            location,
            temperature: temp,
            unit: unit === "fahrenheit" ? "°F" : "°C",
            condition,
            humidity: Math.round(Math.random() * 60 + 30),
            windSpeed: Math.round(Math.random() * 30 + 5),
            feelsLike:
              unit === "fahrenheit"
                ? Math.round(((tempC - 2) * 9) / 5 + 32)
                : tempC - 2,
          };
        },
      }),

      arithmetic: tool({
        description: "Perform arithmetic operations",
        inputSchema: z.object({
          operation: z.enum([
            "add",
            "subtract",
            "multiply",
            "divide",
            "power",
            "sqrt",
            "percentage",
            "modulo",
          ]),
          a: z.number(),
          b: z.number().optional(),
        }),
        execute: async ({ operation, a, b }) => {
          let result: number;
          let expression: string;
          switch (operation) {
            case "add":
              result = a + (b ?? 0);
              expression = `${a} + ${b} = ${result}`;
              break;
            case "subtract":
              result = a - (b ?? 0);
              expression = `${a} - ${b} = ${result}`;
              break;
            case "multiply":
              result = a * (b ?? 1);
              expression = `${a} × ${b} = ${result}`;
              break;
            case "divide":
              if (b === 0) return { error: "Division by zero" };
              result = a / (b ?? 1);
              expression = `${a} ÷ ${b} = ${result}`;
              break;
            case "power":
              result = Math.pow(a, b ?? 2);
              expression = `${a}^${b} = ${result}`;
              break;
            case "sqrt":
              result = Math.sqrt(a);
              expression = `√${a} = ${result}`;
              break;
            case "percentage":
              result = (a * (b ?? 100)) / 100;
              expression = `${b}% of ${a} = ${result}`;
              break;
            case "modulo":
              result = a % (b ?? 1);
              expression = `${a} % ${b} = ${result}`;
              break;
            default:
              return { error: "Unknown operation" };
          }
          return { result, expression, operation, inputs: { a, b } };
        },
      }),

      collect_user_profile: tool({
        description: "Collect personal info from the user via a form.",
        inputSchema: z.object({
          reason: z.string().optional(),
          fields: z.array(z.string()).optional(),
        }),
      }),

      web_search: tool({
        description:
          "Search the web. Call in parallel with fetch_data and read_knowledge_base.",
        inputSchema: z.object({
          query: z.string(),
          source: z.string().optional(),
        }),
        execute: async ({ query, source = "general" }) => {
          const start = Date.now();
          await new Promise((r) => setTimeout(r, 1500));
          return {
            query,
            source,
            summary: `Found 8 relevant results for "${query}".`,
            duration_ms: Date.now() - start,
          };
        },
      }),

      fetch_data: tool({
        description:
          "Fetch structured data. Call in parallel with web_search and read_knowledge_base.",
        inputSchema: z.object({
          url: z.string(),
          data_type: z.string().optional(),
        }),
        execute: async ({ url, data_type = "JSON" }) => {
          const start = Date.now();
          await new Promise((r) => setTimeout(r, 2000));
          return {
            url,
            data_type,
            records: Math.floor(Math.random() * 500) + 50,
            duration_ms: Date.now() - start,
          };
        },
      }),

      read_knowledge_base: tool({
        description:
          "Read knowledge base. Call in parallel with web_search and fetch_data.",
        inputSchema: z.object({
          topic: z.string(),
          depth: z.enum(["shallow", "deep"]).optional(),
        }),
        execute: async ({ topic, depth = "shallow" }) => {
          const start = Date.now();
          await new Promise((r) => setTimeout(r, 1000));
          return {
            topic,
            depth,
            articles_found: Math.floor(Math.random() * 20) + 3,
            duration_ms: Date.now() - start,
          };
        },
      }),

      // ── THE KEY TOOL — returns jobId instantly, triggers background generation ──
      queue_document: tool({
        description:
          "Queue a document for async background generation. Returns a jobId instantly so the user is never blocked. The document generates in the background and the user is notified when ready. Use this for ALL document creation/editing tasks.",
        inputSchema: z.object({
          action: z.enum(["create", "update"]).describe("create or update"),
          title: z.string().describe("Document title"),
          description: z
            .string()
            .optional()
            .describe("Brief description of the document"),
          documentId: z
            .string()
            .optional()
            .describe("ID of doc to update (update action only)"),
          prompt: z
            .string()
            .describe(
              "Detailed instructions for what the document should contain — the background job uses this to generate the full content",
            ),
        }),
        execute: async ({ action, title, description, documentId, prompt }) => {
          // Generate a jobId
          const jobId = randomUUID();

          // Register job and call directly — no HTTP, no deadlock
          documentJobs.set(jobId, {
            status: "pending",
            progress: 0,
            title,
            description,
          });
          // Fire and forget — do NOT await
          generateDocumentInBackground(
            jobId,
            title,
            description,
            prompt,
            conversationContext,
          ).catch((err) =>
            console.error("[queue_document] Background job error:", err),
          );

          // Return jobId to LLM and client IMMEDIATELY — stream closes right after
          return {
            jobId,
            title,
            status: "queued",
            message: `Document "${title}" is being generated in the background. The user will be notified when it's ready.`,
          };
        },
      }),
      create_chart: tool({
        description:
          "Create a data visualization chart. Use this when users ask to visualize data, create charts, or see trends.",
        inputSchema: z.object({
          title: z.string().describe("Chart title"),
          description: z
            .string()
            .optional()
            .describe("Brief description or subtitle"),
          type: z
            .enum(["bar", "line", "pie", "area"])
            .describe("Type of chart"),
          data: z.array(z.record(z.any())).describe("Array of data objects"),
          xKey: z.string().describe("Key for x-axis values"),
          series: z
            .array(
              z.object({
                key: z.string(),
                label: z.string(),
              }),
            )
            .describe("Series to plot"),
          showLegend: z.boolean().optional().default(true),
          showGrid: z.boolean().optional().default(true),
          stacked: z
            .boolean()
            .optional()
            .describe("For bar charts, stack the series"),
        }),
        execute: async (input) => {
          // Validate data
          if (!input.data || input.data.length === 0) {
            throw new Error("No data provided for chart");
          }

          // Return the chart configuration - the UI will render it
          return {
            ...input,
            timestamp: new Date().toISOString(),
          };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
