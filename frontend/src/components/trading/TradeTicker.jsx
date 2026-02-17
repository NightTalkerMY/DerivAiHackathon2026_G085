import { useMemo } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import {
  formatPrice,
  formatVolume,
  formatTime,
} from "../../api/trading";

export function TradeTicker({ ticks, symbol }) {
  const recentTrades = useMemo(() => {
    return [...ticks].reverse().slice(0, 30);
  }, [ticks]);

  if (recentTrades.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-500">
        No trades yet
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 grid grid-cols-3 gap-2 px-2 text-xs font-medium uppercase text-slate-500">
        <span>Price</span>
        <span className="text-right">Volume</span>
        <span className="text-right">Time</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {recentTrades.map((t, i) => {
          const prevTrade = recentTrades[i + 1];
          const isBull = !prevTrade || t.p >= prevTrade.p;

          return (
            <div
              key={`${t.t}-${i}`}
              className="grid grid-cols-3 gap-2 px-2 py-1 text-xs hover:bg-slate-100"
            >
              <span
                className={`flex items-center gap-1 font-medium ${
                  isBull ? "text-green-600" : "text-red-600"
                }`}
              >
                {isBull ? (
                  <ArrowUp className="h-3 w-3" />
                ) : (
                  <ArrowDown className="h-3 w-3" />
                )}
                {formatPrice(t.p)}
              </span>

              <span className="text-right text-slate-600">
                {formatVolume(t.v)}
              </span>

              <span className="text-right text-slate-500">
                {formatTime(t.t)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
