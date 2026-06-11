"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function GradeChart({
  data,
}: {
  data: { grade: string; count: number }[];
}) {
  const maxCount = Math.max(...data.map((d) => d.count), 0);
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: -40, bottom: 5 }}>
        <XAxis dataKey="grade" />
        <YAxis
          domain={[0, Math.ceil(maxCount)]}
          tickCount={maxCount + 1}
          tickFormatter={(value) => Math.floor(value).toString()}
          allowDecimals={false}
        />
        <Tooltip />
        <Bar dataKey="count" fill="#4f46e5" radius={[4 ,4 ,0 ,0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
