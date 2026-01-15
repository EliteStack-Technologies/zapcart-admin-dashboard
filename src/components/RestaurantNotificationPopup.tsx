import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { NotificationData } from '@/types/notifications';
import { useAuth } from '@/contexts/AuthContext';

interface RestaurantNotificationPopupProps {
  notification: NotificationData;
  isTopmost?: boolean;
  onClose: () => void;
  onNavigate?: (path: string) => void;
}

export function RestaurantNotificationPopup({ 
  notification, 
  isTopmost = false,
  onClose, 
  onNavigate 
}: RestaurantNotificationPopupProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Only call onClose after animation is done
  const handleAnimationComplete = () => {
    if (!isVisible) {
      onClose();
    }
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleNavigate = (path: string) => {
    onNavigate?.(path);
    handleClose();
  };

  const getTitle = (type: string) => {
    switch (type) {
      case 'NEW_ORDER':
        return 'New Order Received!';
      case 'NEW_ENQUIRY':
        return 'New Enquiry Received!';
      default:
        return 'Notification!';
    }
  };



  if (!notification) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Only the topmost popup renders the backdrop */}
          {isTopmost && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100]"
              onClick={handleClose}
            />
          )}
          {/* Popup */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ 
              type: "spring", 
              duration: 0.4,
              bounce: 0.3 
            }}
            className="fixed inset-0 flex items-center justify-center z-[101] p-4"
            onAnimationComplete={handleAnimationComplete}
          >
            <div className="w-full max-w-lg">
              <Card className="relative overflow-hidden bg-gradient-to-b from-green-50/90 to-white border border-green-200 shadow-2xl">
                {/* Close button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
                >
                  <X className="w-5 h-5" />
                </Button>
                {/* Content */}
                <div className="p-8 text-center space-y-6">
                  {/* Green checkmark icon */}
                  <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                      <img src="/tick.svg" alt="Success" className="w-10 h-10" />
                    </div>
                  </div>
                  {/* Title */}
                  <h2 className="text-2xl font-bold text-green-600">
                    {getTitle(notification.type)}
                  </h2>
                  {/* Description */}
                  <div className="text-green-700 leading-relaxed max-w-sm mx-auto">
                    {notification.data.customerName && (
                      <p className="mt-2">
                        Customer Name : <span className="font-medium">{notification.data.customerName}</span>
                      </p>
                    )}
                    {notification.data.customerPhone && (
                      <p className="mt-1">
                        Phone Number : {notification.data.customerPhone}
                      </p>
                    )}
                    {notification.data.orderNumber && (
                      <p className="mt-1">
                        Order No : #{notification.data.orderNumber}
                      </p>
                    )}
                  </div>
                  {/* Action buttons */}
                  <div className="flex gap-3 justify-center pt-4">
                    <Button
                      variant="outline"
                      onClick={handleClose}
                      className="border-green-300 text-green-700 hover:bg-green-50"
                    >
                      Dismiss
                    </Button>
                    {notification.data.orderId && (
                      <Button
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleNavigate(`/orders`)}
                      >
                        View Order
                      </Button>
                    )}
                    {notification.data.enquiryId && (
                      <Button
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleNavigate(`/enquiries?highlight=${notification.data.enquiryId}`)}
                      >
                        View Enquiry
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}