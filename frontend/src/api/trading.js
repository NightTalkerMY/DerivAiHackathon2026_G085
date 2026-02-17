// src/api/trading.js

const SYMBOL_MAP = {
  "BINANCE:BTCUSDT": { name: "Bitcoin", short: "BTC", icon: "₿" },
  "BINANCE:ETHUSDT": { name: "Ethereum", short: "ETH", icon: "Ξ" },
  "BINANCE:SOLUSDT": { name: "Solana", short: "SOL", icon: "◎" },
  "BINANCE:BNBUSDT": { name: "BNB", short: "BNB", icon: "◆" },
};

export function getSymbolInfo(symbol) {
  return SYMBOL_MAP[symbol] || {
    name: symbol,
    short: symbol,
    icon: "•",
  };
}

export function formatPrice(price) {
  if (!price) return "0.00";
  if (price >= 1000)
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  if (price >= 1) return price.toFixed(4);
  return price.toFixed(6);
}

export function formatVolume(vol) {
  if (!vol) return "0";
  if (vol >= 1_000_000) return (vol / 1_000_000).toFixed(2) + "M";
  if (vol >= 1_000) return (vol / 1_000).toFixed(2) + "K";
  return vol.toFixed(4);
}

export function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
