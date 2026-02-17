import React from 'react';
import { TrendingUp, TrendingDown, BarChart3, Percent, Clock, DollarSign, Gauge, Shield, Target, Layers, Activity } from "lucide-react";

export function PerformanceSummary({ performanceSummaryData }) {
  const summary = performanceSummaryData || {};

  // Extract metrics (same as before)
  const totalTrades = summary["number of trades"] || 0;
  const netPnL = summary["total profit and loss"] || 0;
  const avgPnLPerTrade = summary["average profit and loss per trade"] || 0;
  const avgTradeDuration = summary["average trade duration in seconds"] || 0;
  const avgNotionalValue = summary["average trade notional value"] || 0;
  const pnlPerSecond = summary["profit and loss per second"] || 0;
  const capitalEfficiency = summary["capital efficiency ratio"] || 0;
  const winRate = summary["directional accuracy percentage"] || 0;
  const riskDefinitionRate = summary["risk definition rate percentage"] || 0;
  const rewardDefinitionRate = summary["reward definition rate percentage"] || 0;
  const structuredTradeRate = summary["structured trade rate percentage"] || 0;

  const isPositivePnL = netPnL >= 0;

  // Formatters (same as before)
  const formatCurrency = (val) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);
  const formatPercent = (val) => `${val.toFixed(1)}%`;
  const formatDecimal = (val) => val.toFixed(4);
  const formatDuration = (sec) => sec < 60 ? `${Math.round(sec)}s` : `${Math.floor(sec / 60)}m ${Math.round(sec % 60)}s`;

  return (
    <div className="bg-white border rounded-xl shadow-lg h-full flex flex-col">
      {/* 1. Header & Key Stats Combined (Ultra Compact) */}
      <div className="p-4 border-b space-y-3 bg-slate-50 rounded-t-xl">
        <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2 text-sm text-slate-700">
            <BarChart3 className="h-4 w-4 text-purple-600" />
            Performance
            </h3>
            <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
            {totalTrades} trades
            </span>
        </div>

        {/* The Big Numbers Row */}
        <div className="flex items-end justify-between gap-4">
            <div>
                <p className="text-xs text-slate-500 font-medium mb-0.5">Net P&L</p>
                <p className={`text-xl font-bold leading-none ${isPositivePnL ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(netPnL)}
                </p>
            </div>
            
            <div className="flex-1 pb-0.5">
                 <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-slate-500">Win Rate</span>
                    <span className="font-bold text-slate-700">{formatPercent(winRate)}</span>
                </div>
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-600" style={{ width: `${winRate}%` }} />
                </div>
            </div>
        </div>
      </div>

      

      {/* 2. Dense Grid for Secondary Metrics (3 Columns) */}
      <div className="p-3 grid grid-cols-2 gap-2 flex-1 content-start">
          <MiniMetric label="Average P/L" value={formatCurrency(avgPnLPerTrade)} color={avgPnLPerTrade >= 0 ? "text-green-600" : "text-red-600"} />
          <MiniMetric label="Average Duration" value={formatDuration(avgTradeDuration)} />
          <MiniMetric label="Average Volume" value={formatCurrency(avgNotionalValue)} />
          
          <MiniMetric label="P/L per second" value={formatDecimal(pnlPerSecond)} color={pnlPerSecond >= 0 ? "text-green-600" : "text-red-600"} />
          <MiniMetric label="Capital Efficiency" value={formatDecimal(capitalEfficiency)} color={capitalEfficiency >= 0 ? "text-green-600" : "text-red-600"} />
          <MiniMetric label="Risk Definition" value={formatPercent(riskDefinitionRate)} color="text-purple-600" />
          
          <MiniMetric label="Reward Definition" value={formatPercent(rewardDefinitionRate)} color="text-purple-600" />
          <MiniMetric label="Structure" value={formatPercent(structuredTradeRate)} color="text-purple-600" />
      </div>
    </div>
  );
}

function MiniMetric({ label, value, color = "text-slate-700" }) {
    return (
        <div className="bg-slate-50 rounded-lg p-2 border border-slate-100 flex flex-col justify-center">
            <span className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</span>
            <span className={`text-xs font-bold truncate ${color}`}>{value}</span>
        </div>
    )
}
