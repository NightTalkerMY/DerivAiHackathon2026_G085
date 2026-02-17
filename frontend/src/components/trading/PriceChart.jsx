import { useMemo, useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { getSymbolInfo, formatPrice } from "../../api/trading";

export function PriceChart({ symbol, ticks, historicalData = [], isLoadingHistorical = false, onLoadHistorical }) {
  const [viewMode, setViewMode] = useState("live");
  const info = useMemo(() => getSymbolInfo(symbol), [symbol]);

  // Fetch historical data when switching to 1H mode
  useEffect(() => {
    if (viewMode === "hourly" && historicalData.length === 0 && !isLoadingHistorical && onLoadHistorical) {
      onLoadHistorical();
    }
  }, [viewMode, historicalData.length, isLoadingHistorical, onLoadHistorical]);

  // Determine which data source to use
  const currentData = viewMode === "live" ? ticks : historicalData;

  const chartData = useMemo(() => {
    if (!currentData || currentData.length === 0) return [];

    return currentData.map((t) => {
      const ms = t.time < 10000000000 ? t.time * 1000 : t.time;
      const d = new Date(ms);
      
      return {
        time: viewMode === "live" 
          ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        price: t.price,
      };
    });
  }, [currentData, viewMode]);

  // Handle the "One Point" visual issue
  const isBull = chartData.length >= 2 ? chartData[chartData.length - 1].price >= chartData[0].price : true;

  return (
    <div className="flex h-full w-full flex-col bg-white p-4 rounded-xl border border-slate-200">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{info.icon}</span>
          <span className="font-bold text-slate-800">{info.short}/USDT</span>
        </div>
        <div className="flex rounded-lg bg-slate-100 p-1">
          {["live", "hourly"].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                viewMode === mode ? "bg-white text-blue-600 shadow-sm" : "text-slate-400"
              }`}
            >
              {mode === "live" ? "LIVE" : "1H"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1" style={{ minHeight: '300px' }}>
        {/* Show loading state */}
        {isLoadingHistorical ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-slate-400">Loading 1H data...</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isBull ? "#22c55e" : "#ef4444"} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={isBull ? "#22c55e" : "#ef4444"} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" hide={chartData.length < 2} tick={{fontSize: 10}} axisLine={false} tickLine={false} />
              <YAxis domain={['auto', 'auto']} hide={chartData.length < 2} tick={{fontSize: 10}} axisLine={false} tickLine={false} />
              <Tooltip formatter={(val) => [`$${formatPrice(val)}`, "Price"]} />
              <Area
                type="monotone"
                dataKey="price"
                stroke={isBull ? "#16a34a" : "#dc2626"}
                strokeWidth={2}
                fill="url(#colorPrice)"
                isAnimationActive={false}
                dot={chartData.length < 10}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
