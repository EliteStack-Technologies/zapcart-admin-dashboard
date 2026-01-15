import React from "react";
import { formatDistanceToNow } from "date-fns";
import {
  ShoppingCart,
  MessageSquare,
  Package,
  Bell,
  TestTube,
  Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationData, NotificationType } from "@/types/notifications";
import { useNotifications } from "@/contexts/NotificationContext";
import { cn } from "@/lib/utils";

interface NotificationItemProps {
  notification: NotificationData;
}

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case "NEW_ORDER":
      return <ShoppingCart className="h-4 w-4 text-green-600" />;
    case "NEW_ENQUIRY":
      return <MessageSquare className="h-4 w-4 text-blue-600" />;
    case "ORDER_STATUS_UPDATE":
      return <Package className="h-4 w-4 text-orange-600" />;
    case "TEST":
      return <TestTube className="h-4 w-4 text-purple-600" />;
    case "CUSTOM":
    default:
      return <Bell className="h-4 w-4 text-gray-600" />;
  }
};

const getNotificationColor = (type: NotificationType) => {
  switch (type) {
    case "NEW_ORDER":
      return "bg-green-50 border-green-200 hover:bg-green-100";
    case "NEW_ENQUIRY":
      return "bg-blue-50 border-blue-200 hover:bg-blue-100";
    case "ORDER_STATUS_UPDATE":
      return "bg-orange-50 border-orange-200 hover:bg-orange-100";
    case "TEST":
      return "bg-purple-50 border-purple-200 hover:bg-purple-100";
    case "CUSTOM":
    default:
      return "bg-gray-50 border-gray-200 hover:bg-gray-100";
  }
};

export function NotificationItem({ notification }: NotificationItemProps) {
  const { markAsRead } = useNotifications();

  const handleClick = () => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navigate to relevant page based on notification type
    if (notification.data.orderId) {
      // Navigate to order details - you can implement this based on your routing
      console.log("Navigate to order:", notification.data.orderId);
    } else if (notification.data.enquiryId) {
      // Navigate to enquiry details
      console.log("Navigate to enquiry:", notification.data.enquiryId);
    }
  };

  const timeAgo = formatDistanceToNow(new Date(notification.timestamp), {
    addSuffix: true,
  });

  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full h-auto  p-3 justify-start relative border",
        getNotificationColor(notification.type),
        !notification.read && "border-l-4"
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3 w-full">
        <div className="flex-shrink-0 mt-0.5">
          {getNotificationIcon(notification.type)}
        </div>

        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-sm leading-tight text-black">
              {notification.data.title}
            </h4>
            {!notification.read && (
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs flex-shrink-0 text-black"
                onClick={(e) => {
                  e.stopPropagation();
                  markAsRead(notification.id);
                }}
              >
                Notify
              </Button>
            )}
          </div>

 

          {notification.data.orderNumber && (
            <div className="flex gap-2 mt-1">
              {notification.data.orderNumber && (
                <span className="text-xs text-muted-foreground">
                  Order No : #{notification.data.orderNumber}
                </span>
              )}
            </div>
          )}
          {notification.data.customerName && (
            <p className="text-xs text-muted-foreground">
              Customer Name : {notification.data.customerName}
            </p>
          )}
          {notification.data.customerName && (
            <p className="text-xs text-muted-foreground">
              Phone Number : {notification.data.customerPhone}
            </p>
          )}
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
        </div>
      </div>
    </Button>
  );
}
