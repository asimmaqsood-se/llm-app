"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import { Image } from "@/components/tool-ui/image";
import { parseSerializableImage, type SerializableImage } from "@/components/tool-ui/image/schema";
import { ImageIcon } from "lucide-react";

type ImageArgs = SerializableImage;

type ImageResult = SerializableImage & {
  timestamp?: string;
};

export const ImageToolUI = makeAssistantToolUI<ImageArgs, ImageResult>({
  toolName: "image",
  render: ({ args, result, status, addResult }) => {


    if (status.type === "running") {
      return (
        <div className="my-3 inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)]/50 px-3 py-2 text-sm text-[var(--color-muted-foreground)]">
          <ImageIcon className="w-3.5 h-3.5 animate-pulse text-green-600" />
          <span>Loading image...</span>
        </div>
      );
    }

    if (status.type === "complete" && args) {
      try {
        // Parse and validate the args
        const validatedProps = parseSerializableImage(args);

        console.l
        
        const handleNavigate = (href: string, image: SerializableImage) => {
          console.log("Navigating to:", href);
          // You can track navigation events here
          addResult?.({
            ...image,
            timestamp: new Date().toISOString()
          });
        };

        return (
          <div className="my-4">
            <Image
              {...validatedProps}
              onNavigate={handleNavigate}
              className="w-full"
            />
          </div>
        );
      } catch (error) {
        console.error("Failed to parse image:", error);
        return (
          <div className="my-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            Error rendering image: Invalid format
          </div>
        );
      }
    }

    return null;
  },
});