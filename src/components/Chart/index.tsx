"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartProps {
  id: string;
  type: "bar" | "line" | "pie" | "area";
  title: string;
  description?: string;
  data: Array<Record<string, any>>;
  xKey: string;
  series: Array<{ key: string; label: string }>;
  showLegend?: boolean;
  showGrid?: boolean;
  stacked?: boolean;
  height?: number;
  className?: string;
}

const COLORS = [
  "#2563eb", // blue-600
  "#16a34a", // green-600
  "#dc2626", // red-600
  "#9333ea", // purple-600
  "#ea580c", // orange-600
  "#0891b2", // cyan-600
  "#4f46e5", // indigo-600
  "#be123c", // rose-700
];

export function Chart({
  id,
  type,
  title,
  description,
  data,
  xKey,
  series,
  showLegend = true,
  showGrid = true,
  stacked = false,
  height = 400,
  className = "",
}: ChartProps) {
  const renderChart = () => {
    switch (type) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />}
              <XAxis 
                dataKey={xKey} 
                tick={{ fontSize: 12 }} 
                className="text-gray-600"
              />
              <YAxis tick={{ fontSize: 12 }} className="text-gray-600" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "white", 
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  fontSize: "12px"
                }}
              />
              {showLegend && <Legend />}
              {series.map((s, index) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  name={s.label}
                  fill={COLORS[index % COLORS.length]}
                  stackId={stacked ? "stack" : undefined}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case "line":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />}
              <XAxis 
                dataKey={xKey} 
                tick={{ fontSize: 12 }} 
                className="text-gray-600"
              />
              <YAxis tick={{ fontSize: 12 }} className="text-gray-600" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "white", 
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  fontSize: "12px"
                }}
              />
              {showLegend && <Legend />}
              {series.map((s, index) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={{ fill: COLORS[index % COLORS.length], r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case "area":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />}
              <XAxis 
                dataKey={xKey} 
                tick={{ fontSize: 12 }} 
                className="text-gray-600"
              />
              <YAxis tick={{ fontSize: 12 }} className="text-gray-600" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "white", 
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  fontSize: "12px"
                }}
              />
              {showLegend && <Legend />}
              {series.map((s, index) => (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label}
                  fill={COLORS[index % COLORS.length]}
                  stroke={COLORS[index % COLORS.length]}
                  fillOpacity={0.3}
                  stackId={stacked ? "stack" : undefined}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      case "pie":
        // For pie charts, we use the first series and show distribution across xKey values
        const pieData = data.map((item) => ({
          name: item[xKey],
          value: item[series[0]?.key] || 0,
        }));

        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={height * 0.3}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "white", 
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  fontSize: "12px"
                }}
              />
              {showLegend && (
                <Legend 
                  layout="vertical" 
                  align="right"
                  verticalAlign="middle"
                />
              )}
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <Card className={`w-full ${className}`}>
      {(title || description) && (
        <CardHeader className="pb-2">
          {title && <CardTitle className="text-lg font-semibold">{title}</CardTitle>}
          {description && <CardDescription className="text-sm text-gray-500">{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        <div style={{ width: "100%", height: title || description ? height - 80 : height }}>
          {data.length > 0 ? (
            renderChart()
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              No data available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}