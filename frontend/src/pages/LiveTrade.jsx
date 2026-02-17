import { useState } from "react";
import { Activity } from "lucide-react";
// Make sure this path matches where you saved the hook
import { useLiveTrade } from "../hooks/useLiveTrade"; 
import { PriceTicker } from "../components/trading/PriceTicker";
import { PriceChart } from "../components/trading/PriceChart";
import { TradeForm } from "../components/trading/TradeForm";

const SYMBOLS = ["BINANCE:BTCUSDT", "BINANCE:ETHUSDT", "BINANCE:SOLUSDT", "BINANCE:BNBUSDT"];

export default function LiveTrade() {
  const [selectedSymbol, setSelectedSymbol] = useState("BINANCE:BTCUSDT");
  
  // FIX: Removed the middle "William" argument so selectedSymbol is correctly passed as the 2nd argument
  const { 
    ticker, 
    tickers, 
    ticks, 
    historicalData, 
    isLoadingHistorical, 
    loadHistoricalData, 
    activeTrade, 
    startTrade, 
    closeTrade,
    currentPnL,
    isClosingTrade,
    setAsset 
  } = useLiveTrade("william", selectedSymbol);

  const handleSymbolChange = (sym) => {
    setSelectedSymbol(sym);
    setAsset(sym);
  };

  const handleCloseTrade = async (exitPrice) => {
    await closeTrade(exitPrice);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 text-blue-600" />
          <h1 className="text-2xl font-bold">Trading Dojo Live Trade</h1>
        </div>
        <div className="text-sm font-medium text-green-500 flex items-center gap-2">
          <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
          Binance Live
        </div>
      </div>

      {/* Ticker Strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {SYMBOLS.map((sym) => {
          const isSelected = sym === selectedSymbol;
          // Use the actual price from tickers for each symbol
          // Added a fallback to prevent "undefined" errors
          const symbolTicker = tickers[sym] || { price: 0, change: 0 };
          
          return (
            <PriceTicker
              key={sym}
              symbol={sym}
              price={symbolTicker.price || 0}
              // Calculate change manually if backend doesn't provide it
              prevPrice={symbolTicker.price} 
              isSelected={isSelected}
              onClick={() => handleSymbolChange(sym)}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chart */}
        <div className="lg:col-span-3 bg-white border rounded-xl p-4 h-[500px]">
          <PriceChart 
            symbol={selectedSymbol} 
            // The hook now returns the merged history+live data in 'ticks'
            ticks={ticks} 
            // We pass ticks as historicalData too because we merged them in the hook
            historicalData={ticks}
            isLoadingHistorical={isLoadingHistorical}
            onLoadHistorical={loadHistoricalData}
          />
        </div>

        {/* Trade Execution Panel */}
        <div className="space-y-6">
          <div className="bg-white border rounded-xl p-4">
            <h2 className="text-sm font-semibold mb-4 italic text-slate-500">
              {activeTrade ? "Trade in Progress..." : "Ready for Entry"}
            </h2>
            
            <TradeForm
              symbol={selectedSymbol}
              currentPrice={ticker.price || 0}
              onStartTrade={startTrade}
              onCloseTrade={handleCloseTrade}
              activeTrade={activeTrade}
              isClosingTrade={isClosingTrade}
              currentPnL={currentPnL}
            />
          </div>
        </div>
      </div>
    </div>
  );
}