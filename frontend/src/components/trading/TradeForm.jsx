import { useState, useMemo } from "react";
import { getSymbolInfo, formatPrice } from "../../api/trading";

export function TradeForm({ 
  symbol, 
  currentPrice, 
  activeTrade,
  onStartTrade,
  onCloseTrade,
  isClosingTrade,
  currentPnL 
}) {
  const info = useMemo(() => getSymbolInfo(symbol), [symbol]);

  const [side, setSide] = useState("Buy");
  const [volume, setVolume] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [loading, setLoading] = useState(false);

  const totalValue = volume ? parseFloat(volume) * currentPrice : 0;

  const handleOpenTrade = async () => {
    if (!volume || parseFloat(volume) <= 0) {
      alert("Please enter valid volume.");
      return;
    }

    setLoading(true);

    try {
      // Prepare trade data
      const tradeData = {
        asset: symbol,
        side,
        entryPrice: currentPrice,
        volume: parseFloat(volume),
        stopLoss: stopLoss ? parseFloat(stopLoss) : null,
        takeProfit: takeProfit ? parseFloat(takeProfit) : null,
      };

      // Call startTrade - this will open trade and fetch AI advisory in background
      onStartTrade(tradeData);

      // Reset form
      setVolume("");
      setStopLoss("");
      setTakeProfit("");
    } catch (err) {
      console.error("Error opening trade:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseTrade = async () => {
    if (!activeTrade) return;

    setLoading(true);

    try {
      // Close trade at current market price
      await onCloseTrade(currentPrice);
    } catch (err) {
      console.error("Error closing trade:", err);
    } finally {
      setLoading(false);
    }
  };

  // If there's an active trade, show trade info and close button
  if (activeTrade) {
    const pnlColor = currentPnL?.amount >= 0 ? "text-green-600" : "text-red-600";
    const pnlSign = currentPnL?.amount >= 0 ? "+" : "";
    
    return (
      <div className="flex flex-col gap-4">
        {/* Active Trade Info */}
        <div className="rounded-lg bg-slate-100 p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs uppercase tracking-wider text-slate-500">
              Active Position
            </span>
            <span className={`text-xs font-bold ${
              activeTrade.side.toLowerCase() === 'buy' ? 'text-green-600' : 'text-red-600'
            }`}>
              {activeTrade.side.toUpperCase()}
            </span>
          </div>
          
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Entry:</span>
              <span className="font-medium">${formatPrice(activeTrade.entryPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Volume:</span>
              <span className="font-medium">{activeTrade.volume}</span>
            </div>
            {activeTrade.stopLoss && (
              <div className="flex justify-between">
                <span className="text-slate-500">SL:</span>
                <span className="font-medium text-red-500">${formatPrice(activeTrade.stopLoss)}</span>
              </div>
            )}
            {activeTrade.takeProfit && (
              <div className="flex justify-between">
                <span className="text-slate-500">TP:</span>
                <span className="font-medium text-green-500">${formatPrice(activeTrade.takeProfit)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Current PnL */}
        {currentPnL && (
          <div className={`rounded-lg p-3 text-center ${currentPnL.amount >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">
              Unrealized P&L
            </div>
            <div className={`text-xl font-bold ${pnlColor}`}>
              {pnlSign}${formatPrice(Math.abs(currentPnL.amount))}
            </div>
            <div className={`text-sm ${pnlColor}`}>
              {pnlSign}{currentPnL.percentage?.toFixed(2)}%
            </div>
          </div>
        )}

        {/* Current Market Price */}
        <div className="rounded-lg bg-slate-100 p-3 text-center">
          <div className="text-xs uppercase tracking-wider text-slate-500">
            Current Price
          </div>
          <div className="text-xl font-bold text-slate-900">
            ${formatPrice(currentPrice)}
          </div>
        </div>

        {/* Close Trade Button */}
        <button
          onClick={handleCloseTrade}
          disabled={loading || isClosingTrade}
          className={`w-full rounded-lg py-3 text-sm font-semibold bg-slate-800 hover:bg-slate-900 text-white`}
        >
          {loading || isClosingTrade ? "Closing..." : `Close ${info.short} Position`}
        </button>
      </div>
    );
  }

  // No active trade - show open trade form
  return (
    <div className="flex flex-col gap-4">
      {/* Buy / Sell toggle */}
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
        <button
          onClick={() => setSide("Buy")}
          className={`rounded-md py-2 text-sm font-semibold transition ${
            side === "Buy"
              ? "bg-green-600 text-white"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setSide("Sell")}
          className={`rounded-md py-2 text-sm font-semibold transition ${
            side === "Sell"
              ? "bg-red-600 text-white"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Sell
        </button>
      </div>

      {/* Market Price */}
      <div className="rounded-lg bg-slate-100 p-3 text-center">
        <div className="text-xs uppercase tracking-wider text-slate-500">
          Market Price
        </div>
        <div className="text-xl font-bold text-slate-900">
          ${formatPrice(currentPrice)}
        </div>
      </div>

      {/* Volume */}
      <div>
        <label className="block text-xs text-slate-500 mb-1">
          Volume ({info.short})
        </label>
        <input
          type="number"
          value={volume}
          onChange={(e) => setVolume(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          placeholder="0.00"
        />
      </div>

      {/* SL / TP */}
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          placeholder="Stop Loss"
          value={stopLoss}
          onChange={(e) => setStopLoss(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <input
          type="number"
          placeholder="Take Profit"
          value={takeProfit}
          onChange={(e) => setTakeProfit(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>

      {/* Total */}
      {totalValue > 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-center text-sm">
          Total ≈ ${totalValue.toLocaleString()}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleOpenTrade}
        disabled={loading}
        className={`w-full rounded-lg py-3 text-sm font-semibold ${
          side === "Buy"
            ? "bg-green-600 hover:bg-green-700 text-white"
            : "bg-red-600 hover:bg-red-700 text-white"
        }`}
      >
        {loading ? "Opening..." : `${side} ${info.short}`}
      </button>
    </div>
  );
}
