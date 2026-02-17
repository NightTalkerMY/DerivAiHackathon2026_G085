import { useMemo } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { getSymbolInfo, formatPrice } from "../../api/trading";

export function PriceTicker({
  symbol,
  price,
  prevPrice,
  isSelected,
  onClick,
}) {
  const info = useMemo(() => getSymbolInfo(symbol), [symbol]);

  const isBull = price >= prevPrice;
  const changePercent =
    prevPrice > 0 ? ((price - prevPrice) / prevPrice) * 100 : 0;

  return (
    <button
      onClick={onClick}
      className={`
        group relative flex items-center gap-3 rounded-lg border p-3 transition-all duration-200
        ${
          isSelected
            ? "border-blue-500 bg-blue-50 shadow-lg shadow-blue-100"
            : "border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50"
        }
      `}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-lg font-bold">
        {info.icon}
      </div>

      <div className="flex flex-1 flex-col items-start">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-slate-900">
            {info.short}
          </span>
          <span className="text-xs text-slate-500">/USDT</span>
        </div>
        <span className="text-base font-semibold text-slate-900">
          ${formatPrice(price)}
        </span>
      </div>

      <div
        className={`flex items-center gap-1 text-xs font-medium ${
          isBull ? "text-green-600" : "text-red-600"
        }`}
      >
        {isBull ? (
          <TrendingUp className="h-3 w-3" />
        ) : (
          <TrendingDown className="h-3 w-3" />
        )}
        <span>
          {isBull ? "+" : ""}
          {changePercent.toFixed(2)}%
        </span>
      </div>

      {isSelected && (
        <div className="absolute -bottom-px left-4 right-4 h-0.5 bg-blue-500" />
      )}
    </button>
  );
}
