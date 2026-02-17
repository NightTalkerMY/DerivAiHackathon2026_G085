import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// --- CONFIGURATION ---
const FINNHUB_TOKEN = import.meta.env.VITE_FINNHUB_API_KEY;
const BACKEND_API_URL = "http://localhost:8000";
const UPDATE_INTERVAL_MS = 1000; 

const SYMBOLS = [
  "BINANCE:BTCUSDT", 
  "BINANCE:ETHUSDT", 
  "BINANCE:SOLUSDT", 
  "BINANCE:BNBUSDT"
];

// --- HELPERS ---
const dispatchToShifuChat = (content) => {
  window.dispatchEvent(new CustomEvent("shifu-add-message", { detail: { content } }));
};

const dispatchDashboardUpdate = () => {
  window.dispatchEvent(new CustomEvent("dashboard-update", { detail: { timestamp: Date.now() } }));
};

export const useLiveTrade = (userId = "william", initialAsset = "BINANCE:BTCUSDT") => {
  const [asset, setAsset] = useState(initialAsset);
  
  const [tickers, setTickers] = useState({});
  // We store live ticks for each asset here
  const [allTicks, setAllTicks] = useState({}); 
  
  const [activeTrade, setActiveTrade] = useState(null);
  const [isClosingTrade, setIsClosingTrade] = useState(false);

  const latestPricesRef = useRef({}); 

  // --- 1. FINNHUB WEBSOCKET ---
  useEffect(() => {
    if (!FINNHUB_TOKEN) return;

    const ws = new WebSocket(`wss://ws.finnhub.io?token=${FINNHUB_TOKEN}`);

    ws.onopen = () => {
      SYMBOLS.forEach((symbol) => {
        ws.send(JSON.stringify({ type: "subscribe", symbol: symbol }));
      });
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "trade" && message.data) {
          message.data.forEach((trade) => {
            const symbol = trade.s;
            const price = trade.p;

            // Update Ticker (Instant)
            setTickers((prev) => ({
              ...prev,
              [symbol]: { price: price, change: 0 }
            }));

            // Buffer for Graph
            latestPricesRef.current[symbol] = price;
          });
        }
      } catch (err) {
        console.error(err);
      }
    };

    return () => { if (ws.readyState === 1) ws.close(); };
  }, []);

  // --- 2. GRAPH THROTTLER ---
  // Updates the graph state once per second based on buffered websocket data
  useEffect(() => {
    const intervalId = setInterval(() => {
      const newPrices = latestPricesRef.current;
      if (Object.keys(newPrices).length === 0) return;

      setAllTicks(prevAllTicks => {
        const nextAllTicks = { ...prevAllTicks };
        
        Object.entries(newPrices).forEach(([symbol, price]) => {
            const newTick = { time: Date.now(), price: price };
            const currentHistory = nextAllTicks[symbol] || [];
            // Keep last 100 points of live data
            nextAllTicks[symbol] = [...currentHistory, newTick].slice(-100);
        });
        
        return nextAllTicks;
      });

      latestPricesRef.current = {};

    }, UPDATE_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, []);

  // --- 3. TRADE LOGIC ---
  const currentPnL = useMemo(() => {
    const currentPrice = tickers[asset]?.price;
    if (!activeTrade || !currentPrice) return null;
    
    const { entryPrice, volume, side } = activeTrade;
    const priceDiff = currentPrice - entryPrice;
    const multiplier = side.toLowerCase() === 'buy' ? 1 : -1;
    
    return {
      amount: priceDiff * volume * multiplier,
      percentage: ((priceDiff / entryPrice) * 100) * multiplier
    };
  }, [activeTrade, tickers, asset]);

  // START TRADE
  const startTrade = useCallback(async (tradeData) => {
    setActiveTrade({ ...tradeData, openTime: Date.now() / 1000 });
    
    try {
        const response = await fetch(`${BACKEND_API_URL}/trade/open`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id: userId,
                asset: tradeData.asset,
                side: tradeData.side,
                volume: tradeData.volume
            })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.ai_overlay_message) {
                dispatchToShifuChat(`**Risk Analysis**\n${data.ai_overlay_message}`);
            }
        }
    } catch (err) {
        console.error("Failed to fetch pre-trade analysis:", err);
    }
    
    dispatchDashboardUpdate();
  }, [userId]);

  // END TRADE (Local cleanup)
  const endTrade = useCallback(() => {
    setActiveTrade(null);
  }, []);

  // CLOSE TRADE (Backend record)
  const closeTrade = useCallback(async (exitPrice) => {
    if (!activeTrade) return;
    setIsClosingTrade(true);
    try {
        const payload = {
            user_id: userId,
            asset: activeTrade.asset,
            side: activeTrade.side,
            entry_price: activeTrade.entryPrice,
            exit_price: exitPrice,
            volume: activeTrade.volume,
            open_time: activeTrade.openTime,
            close_time: Date.now() / 1000,
            stop_loss: activeTrade.stopLoss,
            take_profit: activeTrade.takeProfit
        };

        const response = await fetch(`${BACKEND_API_URL}/trade/close`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        const pnl = data.analysis ? data.analysis["profit and loss"] : "N/A";
        const outcome = data.analysis ? data.analysis["trade outcome"] : "Completed";

        let message = `**Trade Closed**\nOutcome: ${outcome}\nP&L: $${pnl}`;
        if (data.insight) {
            message += `\n\n**AI Insight:** ${data.insight}`;
        }
        dispatchToShifuChat(message);
        dispatchDashboardUpdate();
        setActiveTrade(null);

    } catch (error) {
        console.error("Failed to save trade:", error);
        setActiveTrade(null);
    } finally {
        setIsClosingTrade(false);
    }
  }, [activeTrade, userId]);

  // DATA SELECTOR
  const currentAssetTicks = useMemo(() => {
    return allTicks[asset] || [];
  }, [allTicks, asset]);

  return { 
    ticker: tickers[asset] || { price: 0, change: 0 }, 
    tickers, 
    ticks: currentAssetTicks, 
    historicalData: currentAssetTicks, // Just re-use live ticks since we have no history
    isLoadingHistorical: false,
    loadHistoricalData: async () => {}, // No-op since we removed fetching
    activeTrade, 
    startTrade, 
    endTrade, 
    closeTrade,
    currentPnL,
    isClosingTrade,
    setAsset
  };
};