import React from 'react';
import { Wifi, WifiOff, Loader } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useNotifications } from '@/contexts/NotificationContext';
import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  className?: string;
  showReconnectButton?: boolean;
}

export function ConnectionStatus({ className, showReconnectButton = true }: ConnectionStatusProps) {
  const { connectionStatus, connectWebSocket } = useNotifications();
  const { connected, reconnectAttempts, lastConnected } = connectionStatus;

  const getStatusInfo = () => {
    if (connected) {
      return {
        icon: <Wifi className="h-3 w-3" />,
        text: 'Connected',
        variant: 'default' as const,
        color: 'text-green-600 bg-green-300',
      };
    } else if (reconnectAttempts > 0) {
      return {
        icon: <Loader className="h-3 w-3 animate-spin" />,
        text: 'Reconnecting...',
        variant: 'secondary' as const,
        color: 'text-orange-600 bg-orange-300',
      };
    } else {
      return {
        icon: <WifiOff className="h-3 w-3" />,
        text: 'Disconnected',
        variant: 'destructive' as const,
        color: 'text-red-600 bg-red-300',
      };
    }
  };

  const statusInfo = getStatusInfo();

  const tooltipContent = connected
    ? 'WebSocket connected - receiving real-time notifications'
    : reconnectAttempts > 0
    ? `Reconnecting... (attempt ${reconnectAttempts})`
    : `WebSocket disconnected${lastConnected ? ` - Last connected: ${lastConnected.toLocaleTimeString()}` : ''}`;

  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-2", className)}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant={statusInfo.variant} 
              className={cn("gap-1 cursor-help", statusInfo.color)}
            >
              {statusInfo.icon}
              <span className="text-xs">{statusInfo.text}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipContent}</p>
          </TooltipContent>
        </Tooltip>

        {!connected && showReconnectButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={connectWebSocket}
            className="h-6 px-2 text-xs"
          >
            Retry
          </Button>
        )}
      </div>
    </TooltipProvider>
  );
}