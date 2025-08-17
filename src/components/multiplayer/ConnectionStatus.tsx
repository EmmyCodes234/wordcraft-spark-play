import React from "react";
import { useRealtime } from "@/context/RealtimeContext";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, Loader2, AlertTriangle } from "lucide-react";

export const ConnectionStatus: React.FC = () => {
  const { connectionStatus, isConnected, liveRaceState } = useRealtime();

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case "connected":
        return <Wifi className="h-3 w-3" />;
      case "connecting":
        return <Loader2 className="h-3 w-3 animate-spin" />;
      case "error":
        return <AlertTriangle className="h-3 w-3" />;
      default:
        return <WifiOff className="h-3 w-3" />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case "connected":
        return "Connected";
      case "connecting":
        return "Connecting...";
      case "error":
        return "Connection Error";
      default:
        return "Disconnected";
    }
  };

  const getStatusVariant = () => {
    switch (connectionStatus) {
      case "connected":
        return "default" as const;
      case "connecting":
        return "secondary" as const;
      case "error":
        return "destructive" as const;
      default:
        return "outline" as const;
    }
  };

  if (!liveRaceState) return null;

  return (
    <Badge variant={getStatusVariant()} className="gap-1">
      {getStatusIcon()}
      {getStatusText()}
    </Badge>
  );
};