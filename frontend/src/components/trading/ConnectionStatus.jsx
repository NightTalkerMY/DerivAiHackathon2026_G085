import { Wifi, WifiOff } from "lucide-react";

export function ConnectionStatus({ connected }) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        connected
          ? "bg-green-100 text-green-600"
          : "bg-red-100 text-red-600"
      }`}
    >
      {connected ? (
        <>
          <Wifi className="h-3 w-3" />
          <span>Live</span>
          <span className="h-1.5 w-1.5 rounded-full bg-green-600 animate-pulse" />
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          <span>Disconnected</span>
        </>
      )}
    </div>
  );
}
