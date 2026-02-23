"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import { Chart } from "@/components/Chart";
import { BarChart3, LineChart, PieChart, AreaChart } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2 } from "lucide-react";
import { useState } from "react";

type ChartArgs = {
  title: string;
  description?: string;
  type: "bar" | "line" | "pie" | "area";
  data: Array<Record<string, any>>;
  xKey: string;
  series: Array<{ key: string; label: string }>;
  showLegend?: boolean;
  showGrid?: boolean;
  stacked?: boolean;
};

type ChartResult = ChartArgs & {
  timestamp?: string;
};

const chartIcons = {
  bar: BarChart3,
  line: LineChart,
  pie: PieChart,
  area: AreaChart,
};

const chartColors = {
  bar: "text-blue-600",
  line: "text-emerald-600",
  pie: "text-purple-600",
  area: "text-orange-600",
};

export const ChartToolUI = makeAssistantToolUI<ChartArgs, ChartResult>({
  toolName: "create_chart",
  render: ({ args, result, status }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    if (status.type === "running") {
      const Icon = args?.type ? chartIcons[args.type] : BarChart3;
      const colorClass = args?.type ? chartColors[args.type] : "text-blue-600";
      
      return (
        <div className="my-3 inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)]/50 px-3 py-2 text-sm text-[var(--color-muted-foreground)]">
          <Icon className={`w-3.5 h-3.5 animate-pulse ${colorClass}`} />
          <span>Generating chart...</span>
        </div>
      );
    }

    if (status.type === "complete" && result) {
      const Icon = chartIcons[result.type];
      const colorClass = chartColors[result.type];
      
      // For pie charts, show a simpler preview
      if (result.type === "pie") {
        const total = result.data.reduce((sum, item) => {
          return sum + (item[result.series[0]?.key] || 0);
        }, 0);
        
        return (
          <div className="my-4">
            <div className="inline-flex items-center gap-3 mb-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 shadow-sm">
              <div className={`p-2 rounded-lg bg-[var(--color-muted)] ${colorClass}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-[var(--color-muted-foreground)] mb-0.5 capitalize">{result.type} chart</p>
                <p className="font-medium text-sm">
                  {result.title} • {result.data.length} data points
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 ml-2"
                onClick={() => setIsExpanded(true)}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Preview for pie chart */}
            <div className="mt-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)]  p-4" >
              <div className="flex flex-wrap gap-4">
                {result.data.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: `hsl(${idx * 45}, 70%, 60%)` }}
                    />
                    <span className="text-xs">
                      {item[result.xKey]}: {item[result.series[0]?.key]} 
                      ({((item[result.series[0]?.key] / total) * 100).toFixed(1)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Full chart dialog */}
            <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
              <DialogContent className={result.data.length > 10 ? "max-w-6xl w-[90vw]" : "max-w-3xl"}>
                <DialogHeader className="flex flex-row items-center justify-between">
                  <DialogTitle>{result.title}</DialogTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsExpanded(false)}
                    className="h-8 w-8"
                  >
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                </DialogHeader>
                {result.description && (
                  <p className="text-sm text-[var(--color-muted-foreground)] -mt-2">
                    {result.description}
                  </p>
                )}
                <div className={result.data.length > 10 ? "h-[70vh]" : "h-[400px]"}>
                  <Chart
                    id={`chart-${Date.now()}`}
                    type={result.type}
                    title={result.title}
                    description={result.description}
                    data={result.data}
                    xKey={result.xKey}
                    series={result.series}
                    showLegend={result.showLegend ?? true}
                    showGrid={result.showGrid ?? true}
                    stacked={result.stacked}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        );
      }
      
      // For bar, line, area charts - show preview thumbnail
      return (
        <div className="my-4">
          <div className="inline-flex items-center gap-3 mb-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 shadow-sm">
            <div className={`p-2 rounded-lg bg-[var(--color-muted)] ${colorClass}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-[var(--color-muted-foreground)] mb-0.5 capitalize">{result.type} chart</p>
              <p className="font-medium text-sm">
                {result.title} • {result.data.length} data points
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 ml-2"
              onClick={() => setIsExpanded(true)}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Mini preview */}
          <div className="mt-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] h-125 p-4">
            <div className="h-24 w-full">
              <Chart
                id={`chart-preview-${Date.now()}`}
                type={result.type}
                title=""
                data={result.data.slice(0, 5)} // Show only first 5 items in preview
                xKey={result.xKey}
                series={result.series}
                showLegend={false}
                showGrid={false}
                stacked={result.stacked}
              />
            </div>
          </div>

          {/* Full chart dialog */}
          <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
            <DialogContent className={result.data.length > 10 ? "max-w-6xl w-[90vw]" : "max-w-3xl"}>
              <DialogHeader className="flex flex-row items-center justify-between">
                <DialogTitle>{result.title}</DialogTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsExpanded(false)}
                  className="h-8 w-8"
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
              </DialogHeader>
              {result.description && (
                <p className="text-sm text-[var(--color-muted-foreground)] -mt-2">
                  {result.description}
                </p>
              )}
              <div className={result.data.length > 10 ? "h-[70vh]" : "h-[400px]"}>
                <Chart
                  id={`chart-full-${Date.now()}`}
                  type={result.type}
                  title={result.title}
                  description={result.description}
                  data={result.data}
                  xKey={result.xKey}
                  series={result.series}
                  showLegend={result.showLegend ?? true}
                  showGrid={result.showGrid ?? true}
                  stacked={result.stacked}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      );
    }

    return null;
  },
});