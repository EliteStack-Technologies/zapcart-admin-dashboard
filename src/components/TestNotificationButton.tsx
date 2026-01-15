import React, { useState } from 'react';
import { TestTube, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/contexts/NotificationContext';
import { useToast } from '@/hooks/use-toast';

export function TestNotificationButton() {
  const { sendTestNotification, connectionStatus } = useNotifications();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleTestNotification = async () => {
    if (!connectionStatus.connected) {
      toast({
        title: "Connection Error",
        description: "WebSocket is not connected. Please check your connection.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      sendTestNotification();
      
      toast({
        title: "Test Notification Sent",
        description: "A test notification has been sent. You should receive it shortly.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send test notification",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => setIsLoading(false), 1000); // Brief delay to show loading
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleTestNotification}
      disabled={!connectionStatus.connected || isLoading}
      className="gap-2"
    >
      {isLoading ? (
        <Loader className="h-4 w-4 animate-spin" />
      ) : (
        <TestTube className="h-4 w-4" />
      )}
      {isLoading ? 'Sending...' : 'Send Test Notification'}
    </Button>
  );
}