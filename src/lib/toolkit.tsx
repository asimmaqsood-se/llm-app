"use client";

import { z } from "zod";
import { SendEmailTool } from "@/components/tools/SendEmailTool";

// Define your toolkit with all tools
export const toolkit = {
  weather: {
    description: "Get the current weather for a specific location",
    parameters: z.object({
      location: z.string().describe("The city and country, e.g. 'London, UK'"),
      unit: z.enum(["celsius", "fahrenheit"]).optional().describe("Temperature unit"),
    }),
  },

  arithmetic: {
    description: "Perform arithmetic operations: add, subtract, multiply, divide, power, sqrt, percentage, modulo",
    parameters: z.object({
      operation: z.enum(["add", "subtract", "multiply", "divide", "power", "sqrt", "percentage", "modulo"]),
      a: z.number().describe("First number"),
      b: z.number().optional().describe("Second number (not needed for sqrt)"),
    }),
  },

  collect_user_profile: {
    description: "Collect personal information from the user via an interactive form.",
    parameters: z.object({
      reason: z.string().optional().describe("Why you need this info"),
      fields: z.array(z.string()).optional().describe("Fields to collect"),
    }),
  },

  web_search: {
    description: "Search the web for information on a topic.",
    parameters: z.object({
      query: z.string().describe("The search query"),
      source: z.string().optional().describe("Preferred source type"),
    }),
  },

  fetch_data: {
    description: "Fetch structured data from an API or database.",
    parameters: z.object({
      url: z.string().describe("The data source URL or identifier"),
      data_type: z.string().optional().describe("Type of data to fetch"),
    }),
  },

  read_knowledge_base: {
    description: "Read internal knowledge base for a topic.",
    parameters: z.object({
      topic: z.string().describe("The topic to look up"),
      depth: z.enum(["shallow", "deep"]).optional().describe("Search depth"),
    }),
  },

  queue_document: {
    description: "Queue a document for async background generation.",
    parameters: z.object({
      action: z.enum(["create", "update"]).describe("create or update"),
      title: z.string().describe("Document title"),
      description: z.string().optional().describe("Brief description"),
      documentId: z.string().optional().describe("ID of doc to update"),
      prompt: z.string().describe("Instructions for document content"),
    }),
  },

  send_email: {
    description: "Send an email with confirmation. This tool will ask the user for confirmation before actually sending the email.",
    parameters: z.object({
      to: z.string().email().describe("Recipient email address"),
      subject: z.string().describe("Email subject line"),
      body: z.string().describe("Email body content"),
    }),
    generateUI: ({ args, result, addResult, isInProgress } : any) => {
      return (
        <SendEmailTool
          args={args}
          result={result}
          addResult={addResult}
          isInProgress={isInProgress}
        />
      );
    },
  },
} as const;

export type Toolkit = typeof toolkit;