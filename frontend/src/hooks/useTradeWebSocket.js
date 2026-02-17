import { useEffect, useRef, useState, useCallback } from "react";

export function useTradeWebSocket({ url, maxTicks = 100 }) {
  const [state, setState] = useState({
    connected: false,
    symbols: [],
    ticks: {},
    latestPrices: {},
  });

  const wsRef = useRef(null);
  const reconnectTimeout = useRef(null);
  
  // 1. ADD THIS REF to track the last time we allowed an update per symbol
  const lastUpdateRef = useRef({});

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setState((prev) => ({ ...prev, connected: true }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === "snapshot") {
          // ... (Keep your snapshot code exactly as it is)
          const latestPrices = {};
          msg.symbols.forEach((sym) => {
            const ticks = msg.windows[sym] || [];
            const last = ticks[ticks.length - 1];
            const prev = ticks[ticks.length - 2];
            if (last) {
              latestPrices[sym] = {
                price: last.p,
                prevPrice: prev?.p ?? last.p,
                volume: last.v,
                time: last.t,
              };
            }
          });

          setState((prev) => ({
            ...prev,
            symbols: msg.symbols,
            ticks: msg.windows,
            latestPrices,
          }));
        } 
        
        else if (msg.type === "tick") {
          const tick = msg.tick;
          const now = Date.now();
          const symbol = tick.s;

          // 2. THE GATEKEEPER LOGIC
          // Only update if it's been more than 60,000ms (1 minute) since the last update for this symbol
          if (!lastUpdateRef.current[symbol] || now - lastUpdateRef.current[symbol] >= 60000) {
            
            lastUpdateRef.current[symbol] = now; // Update the timestamp

            setState((prev) => {
              const existing = prev.ticks[tick.s] || [];
              const updated = [...existing, tick];

              if (updated.length > maxTicks) {
                updated.shift();
              }

              const prevPrice = prev.latestPrices[tick.s]?.price ?? tick.p;

              return {
                ...prev,
                ticks: {
                  ...prev.ticks,
                  [tick.s]: updated,
                },
                latestPrices: {
                  ...prev.latestPrices,
                  [tick.s]: {
                    price: tick.p,
                    prevPrice,
                    volume: tick.v,
                    time: tick.t,
                  },
                },
              };
            });
          }
        }
      } catch (err) {
        console.error("WebSocket parse error:", err);
      }
    };

    // ... (Keep the rest of your onclose/onerror code)
    ws.onclose = () => {
      setState((prev) => ({ ...prev, connected: false }));
      reconnectTimeout.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [url, maxTicks]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      wsRef.current?.close();
    };
  }, [connect]);

  return state;
}