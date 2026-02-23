// import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
// import { streamText, tool, convertToModelMessages, UIMessage } from "ai";
// import { z } from "zod";

// const MODEL = "anthropic.claude-3-5-sonnet-20240620-v1:0";

// const bedrock = createAmazonBedrock({
//   region: process.env.AWS_REGION || "us-east-1",
//   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
// });

// export const maxDuration = 60;

// const SYSTEM_PROMPT = `You are a helpful AI assistant similar to Claude. You can help users with a wide range of tasks.

// IMPORTANT DOCUMENT RULES:
// When a user asks you to write, create, generate, draft, or edit any document (essays, reports, articles, letters, stories, code files, README files, proposals, plans, or any substantial text content), you MUST use the "document" tool to create or update the document. Do NOT write the document content inline in your message — always use the tool.

// - For NEW documents: use the document tool with action "create"
// - For EDITING existing documents: use the document tool with action "update" and include the full updated content

// PROFILE COLLECTION RULES:
// When you receive a collect_user_profile tool result, you MUST immediately call the document tool next — do NOT respond with plain text. Use the profile data to generate the requested document right away.

// You have access to these tools:
// 1. weather — Get current weather for any location
// 2. arithmetic — Perform math operations
// 3. document — Create or update documents (ALWAYS use this for any writing/document tasks)
// 4. collect_user_profile — Collect personal info from the user via a form

// Be conversational, helpful, and precise. When using the document tool, always provide the COMPLETE content of the document in Markdown. IMPORTANT: When calling the document tool, always put the 'content' field LAST in your arguments — after action, title, description, and documentId.

// If the user asks you to personalize advice, create a profile, or you need personal info to help better — use the collect_user_profile tool to ask them via a form.

// PARALLEL TOOL EXECUTION:
// When a user asks to "research", "investigate", "gather info on", or "look up" a topic — call web_search, fetch_data, AND read_knowledge_base ALL AT ONCE in the same step. Do NOT call them one by one. Call all three simultaneously so they run in parallel. This is faster and more efficient.`;

// export async function POST(req: Request) {
//   const { messages, system }: { messages: UIMessage[]; system?: string } = await req.json();

//   const modelMessages = await convertToModelMessages(messages);

//   const result = streamText({
//     model: bedrock(MODEL),
//     system: system ?? SYSTEM_PROMPT,
//     messages: modelMessages,
//     experimental_context: false,
//     tools: {
//       weather: tool({
//         description: "Get the current weather for a specific location",
//         inputSchema: z.object({
//           location: z.string().describe("The city and country, e.g. 'London, UK'"),
//           unit: z.enum(["celsius", "fahrenheit"]).optional().describe("Temperature unit"),
//         }),
//         execute: async ({ location, unit = "celsius" }) => {
//           const conditions = [
//             "Sunny", "Partly Cloudy", "Overcast", "Light Rain",
//             "Heavy Rain", "Thunderstorm", "Snow", "Foggy", "Windy", "Clear",
//           ];
//           const condition = conditions[Math.floor(Math.random() * conditions.length)];
//           const tempC = Math.round(Math.random() * 35 - 5);
//           const temp = unit === "fahrenheit" ? Math.round((tempC * 9) / 5 + 32) : tempC;
//           return {
//             location,
//             temperature: temp,
//             unit: unit === "fahrenheit" ? "°F" : "°C",
//             condition,
//             humidity: Math.round(Math.random() * 60 + 30),
//             windSpeed: Math.round(Math.random() * 30 + 5),
//             feelsLike: unit === "fahrenheit" ? Math.round(((tempC - 2) * 9) / 5 + 32) : tempC - 2,
//           };
//         },
//       }),

//       arithmetic: tool({
//         description: "Perform arithmetic operations: add, subtract, multiply, divide, power, sqrt, percentage, modulo",
//         inputSchema: z.object({
//           operation: z.enum(["add", "subtract", "multiply", "divide", "power", "sqrt", "percentage", "modulo"]),
//           a: z.number().describe("First number"),
//           b: z.number().optional().describe("Second number (not needed for sqrt)"),
//         }),
//         execute: async ({ operation, a, b }) => {
//           let result: number;
//           let expression: string;
//           switch (operation) {
//             case "add":      result = a + (b ?? 0); expression = `${a} + ${b} = ${result}`; break;
//             case "subtract": result = a - (b ?? 0); expression = `${a} - ${b} = ${result}`; break;
//             case "multiply": result = a * (b ?? 1); expression = `${a} × ${b} = ${result}`; break;
//             case "divide":
//               if (b === 0) return { error: "Division by zero" };
//               result = a / (b ?? 1); expression = `${a} ÷ ${b} = ${result}`; break;
//             case "power":      result = Math.pow(a, b ?? 2);   expression = `${a}^${b} = ${result}`; break;
//             case "sqrt":       result = Math.sqrt(a);           expression = `√${a} = ${result}`; break;
//             case "percentage": result = (a * (b ?? 100)) / 100; expression = `${b}% of ${a} = ${result}`; break;
//             case "modulo":     result = a % (b ?? 1);           expression = `${a} % ${b} = ${result}`; break;
//             default: return { error: "Unknown operation" };
//           }
//           return { result, expression, operation, inputs: { a, b } };
//         },
//       }),

//         collect_user_profile: tool({
//         description: "Collect personal information from the user via an interactive form. Use this when you need the user's name, age, occupation, or goals to give a personalized response. The user will fill in a form and submit — you will receive the data as the tool result.",
//         inputSchema: z.object({
//           reason: z.string().optional().describe("Why you need this info — shown to the user above the form"),
//           fields: z.array(z.string()).optional().describe("Fields to collect"),
//         }),
//         // No execute — user fills the form client-side via addResult()
//       }),

//       web_search: tool({
//         description: "Search the web for information on a topic. Call this in parallel with fetch_data and read_knowledge_base when researching.",
//         inputSchema: z.object({
//           query: z.string().describe("The search query"),
//           source: z.string().optional().describe("Preferred source type"),
//         }),
//         execute: async ({ query, source = "general" }) => {
//           const start = Date.now();
//           // Simulate async web search (1.5 seconds)
//           await new Promise(r => setTimeout(r, 1500));
//           return {
//             query,
//             source,
//             summary: `Found 8 relevant results for "${query}" from web sources including recent articles, documentation, and research papers.`,
//             duration_ms: Date.now() - start,
//           };
//         },
//       }),

//       fetch_data: tool({
//         description: "Fetch structured data from an API or database. Call this in parallel with web_search and read_knowledge_base when researching.",
//         inputSchema: z.object({
//           url: z.string().describe("The data source URL or identifier"),
//           data_type: z.string().optional().describe("Type of data to fetch"),
//         }),
//         execute: async ({ url, data_type = "JSON" }) => {
//           const start = Date.now();
//           // Simulate async data fetch (2 seconds)
//           await new Promise(r => setTimeout(r, 2000));
//           return {
//             url,
//             data_type,
//             records: Math.floor(Math.random() * 500) + 50,
//             duration_ms: Date.now() - start,
//           };
//         },
//       }),

//       read_knowledge_base: tool({
//         description: "Read internal knowledge base for a topic. Call this in parallel with web_search and fetch_data when researching.",
//         inputSchema: z.object({
//           topic: z.string().describe("The topic to look up"),
//           depth: z.enum(["shallow", "deep"]).optional().describe("Search depth"),
//         }),
//         execute: async ({ topic, depth = "shallow" }) => {
//           const start = Date.now();
//           // Simulate async KB read (1 second)
//           await new Promise(r => setTimeout(r, 1000));
//           return {
//             topic,
//             depth,
//             articles_found: Math.floor(Math.random() * 20) + 3,
//             duration_ms: Date.now() - start,
//           };
//         },
//       }),
//       document: tool({
//         description: "Create a new document or update an existing document. Use this whenever the user asks to write, create, generate, draft, or edit any document, essay, article, report, story, code, or substantial text content.",
//         inputSchema: z.object({
//           action: z.enum(["create", "update"]).describe("Whether to create a new document or update an existing one"),
//           title: z.string().describe("The title of the document"),
//           description: z.string().optional().describe("Brief description of what changed or what this document is about"),
//           documentId: z.string().optional().describe("The ID of the document to update (required for update action)"),
//           content: z.string().describe("The full Markdown content of the document"),
//         }),
//          execute: async (args) => args,
//         // No execute — handled client-side via makeAssistantToolUI
//       }),
//     },
//   });

//   return result.toUIMessageStreamResponse();
// }

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
    },
  });

  return result.toUIMessageStreamResponse({ sendUsage: false });
}
