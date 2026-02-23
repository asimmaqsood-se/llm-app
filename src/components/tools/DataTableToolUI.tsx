"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import { DataTable } from "@/components/tool-ui/data-table";
import { TableIcon } from "lucide-react";
import { parseSerializableDataTable, type SerializableDataTable } from "@/components/tool-ui/data-table/schema";

type DataTableArgs = SerializableDataTable;

type DataTableResult = SerializableDataTable & {
  timestamp?: string;
};

export const DataTableToolUI = makeAssistantToolUI<DataTableArgs, DataTableResult>({
  toolName: "data_table",
  render: ({ args, result, status }) => {
    if (status.type === "running") {
      return (
        <div className="my-3 inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)]/50 px-3 py-2 text-sm text-[var(--color-muted-foreground)]">
          <TableIcon className="w-3.5 h-3.5 animate-pulse text-purple-600" />
          <span>Generating data table...</span>
        </div>
      );
    }

    if (status.type === "complete" && result) {
      try {
        // Parse and validate the result
        const validatedProps = parseSerializableDataTable(result);
        
        // For card view on mobile, you can add a view toggle
        return (
          <div className="my-4">
            <DataTable
              {...validatedProps}
              // Add client-side props
              className="w-full"
              // You can add onSortChange if you want to handle sorting
              // onSortChange={(next) => console.log("Sort changed:", next)}
            />
          </div>
        );
      } catch (error) {
        console.error("Failed to parse data table:", error);
        return (
          <div className="my-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            Error rendering data table: Invalid data format
          </div>
        );
      }
    }

    return null;
  },
});