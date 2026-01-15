import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNotifications } from '@/contexts/NotificationContext';
import { TestNotificationButton } from './TestNotificationButton';
import { NotificationSoundType } from '@/types/notifications';

interface NotificationSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationSettings({ open, onOpenChange }: NotificationSettingsProps) {
  const { settings, updateSettings } = useNotifications();

  const handleToastDurationChange = (value: string) => {
    const duration = parseInt(value);
    updateSettings({ toastDuration: duration });
  };

  const handleSoundTypeChange = (value: NotificationSoundType) => {
    updateSettings({ soundType: value });
  };

  const handleSoundDurationChange = (value: string) => {
    const duration = parseInt(value);
    updateSettings({ soundDuration: duration });
  };

  const testSound = () => {
    if (settings.soundEnabled) {
      // Create a test sound with current settings
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        const soundConfigs = {
          beep: { frequency: 800, type: 'sine' as OscillatorType },
          chime: { frequency: 800, type: 'sine' as OscillatorType },
          bell: { frequency: 900, type: 'triangle' as OscillatorType },
          ding: { frequency: 1200, type: 'sine' as OscillatorType },
          pop: { frequency: 600, type: 'square' as OscillatorType }
        };

        const config = soundConfigs[settings.soundType] || soundConfigs.chime;
        oscillator.type = config.type;
        oscillator.frequency.setValueAtTime(config.frequency, audioContext.currentTime);
        
        const duration = settings.soundDuration / 1000;
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
      } catch (error) {
        console.warn('Could not play test sound:', error);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Notification Settings</DialogTitle>
          <DialogDescription>
            Customize how you receive notifications in the admin dashboard.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Sound Notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sound-enabled" className="text-sm font-medium">
                Sound notifications
              </Label>
              <p className="text-xs text-muted-foreground">
                Play a sound when new notifications arrive
              </p>
            </div>
            <Switch
              id="sound-enabled"
              checked={settings.soundEnabled}
              onCheckedChange={(checked) => updateSettings({ soundEnabled: checked })}
            />
          </div>

          {/* Sound Type */}
          {settings.soundEnabled && (
            <div className="space-y-2">
              <Label htmlFor="sound-type" className="text-sm font-medium">
                Sound type
              </Label>
              <div className="flex gap-2">
                <Select
                  value={settings.soundType}
                  onValueChange={handleSoundTypeChange}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beep">Beep</SelectItem>
                    <SelectItem value="chime">Chime</SelectItem>
                    <SelectItem value="bell">Bell</SelectItem>
                    <SelectItem value="ding">Ding</SelectItem>
                    <SelectItem value="pop">Pop</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={testSound}
                  className="px-3"
                >
                  Test
                </Button>
              </div>
            </div>
          )}

          {/* Sound Duration */}
          {settings.soundEnabled && (
            <div className="space-y-2">
              <Label htmlFor="sound-duration" className="text-sm font-medium">
                Sound duration
              </Label>
              <Select
                value={settings.soundDuration.toString()}
                onValueChange={handleSoundDurationChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="200">Short (0.2s)</SelectItem>
                  <SelectItem value="500">Medium (0.5s)</SelectItem>
                  <SelectItem value="800">Long (0.8s)</SelectItem>
                  <SelectItem value="1000">Extra Long (1s)</SelectItem>
                  <SelectItem value="2000">Extra Long (2s)</SelectItem>
                  <SelectItem value="5000">Extra Long (5s)</SelectItem>
                  <SelectItem value="10000">Extra Long (10s)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Toast Notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show-toast" className="text-sm font-medium">
                Toast notifications
              </Label>
              <p className="text-xs text-muted-foreground">
                Show popup notifications on screen
              </p>
            </div>
            <Switch
              id="show-toast"
              checked={settings.showToast}
              onCheckedChange={(checked) => updateSettings({ showToast: checked })}
            />
          </div>

          {/* Auto-hide Toast */}
          {settings.showToast && (
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-hide" className="text-sm font-medium">
                  Auto-hide toasts
                </Label>
                <p className="text-xs text-muted-foreground">
                  Automatically hide toast notifications
                </p>
              </div>
              <Switch
                id="auto-hide"
                checked={settings.autoHideToast}
                onCheckedChange={(checked) => updateSettings({ autoHideToast: checked })}
              />
            </div>
          )}

          {/* Toast Duration */}
          {settings.showToast && settings.autoHideToast && (
            <div className="space-y-2">
              <Label htmlFor="toast-duration" className="text-sm font-medium">
                Toast duration
              </Label>
              <Select
                value={settings.toastDuration.toString()}
                onValueChange={handleToastDurationChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3000">3 seconds</SelectItem>
                  <SelectItem value="5000">5 seconds</SelectItem>
                  <SelectItem value="7000">7 seconds</SelectItem>
                  <SelectItem value="10000">10 seconds</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

   
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}