import React from 'react';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Legend,
    Tooltip
} from "recharts";
import {Target} from 'lucide-react';

// Custom Tooltip Component
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-purple-100 rounded-lg shadow-xl">
        <p className="font-semibold text-purple-800 text-xs">{data.subject}</p>
        <p className="text-slate-600 text-xs">
          Proficiency: <span className="font-bold text-purple-600">{data.current}%</span>
        </p>
      </div>
    );
  }
  return null;
};

export function CompetencyRadar({ competencyRadarData }) {
  const transformedData = Object.entries(competencyRadarData || {}).map(([category, score]) => ({
    subject: category.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
    current: score,
    max: 100, 
  }));

  if (!transformedData || transformedData.length === 0) {
    return (
      <div className="bg-white border rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-600" />
            Competency Radar
          </h3>
        </div>
        <div className="p-4 text-sm text-slate-600">
          Complete lessons to build your competency profile.
        </div>
      </div>
    );
  }



  return (
    <div className="bg-white border rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
        <h3 className="font-semibold flex items-center gap-2 p-4 border-b">
          <Target className="h-5 w-5 text-purple-600" />
          Competency Radar
        </h3>
      <div className="p-4">
        <div className="flex justify-center">
            <div className="w-full max-w-[420px] mx-auto">
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={transformedData} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            />
            {/* 1. Remove tick labels */}
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={false} 
              axisLine={false}
            />
            {/* 2. Add Tooltip for hover effect */}
            <Tooltip content={<CustomTooltip />} />
            
            <Radar
              name="Current"
              dataKey="current"
              stroke="#9333ea"
              fill="#9333ea"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Radar
              name="Max"
              dataKey="max"
              stroke="#c4b5fd"
              fill="#c4b5fd"
              fillOpacity={0.1}
              strokeWidth={1}
              strokeDasharray="4 4"
            />
            <Legend
              wrapperStyle={{ fontSize: 12, color: "#64748b" }}
            />
          </RadarChart>
        </ResponsiveContainer>
        </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {transformedData.map((d) => (
            <div 
              key={d.subject} 
              className="flex items-center justify-between text-xs p-2 rounded-md bg-purple-50 hover:bg-purple-100 transition-colors duration-200 cursor-default"
            >
              <span className="text-slate-700 truncate">{d.subject}</span>
              <span className="font-semibold text-purple-600">{d.current}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}