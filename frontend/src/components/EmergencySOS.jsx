import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { triggerSOS } from '../lib/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Textarea } from './ui/textarea';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const EmergencySOS = () => {
  const { isAuthenticated, isClient } = useAuth();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  if (!isAuthenticated || !isClient) return null;

  const handleSOS = async () => {
    setSending(true);
    const sendAlert = async (coords) => {
      try {
        const res = await triggerSOS({
          message: message || undefined,
          latitude: coords?.latitude,
          longitude: coords?.longitude,
        });
        const count = res.data.contacts_notified;
        toast.success(
          count > 0
            ? `Emergency alert sent. ${count} emergency contact(s) notified.`
            : 'Emergency alert recorded. Add emergency contacts in the Safety Center for them to be notified.'
        );
        setOpen(false);
        setMessage('');
      } catch (e) {
        toast.error('Failed to send alert. Please call local emergency services.');
      } finally {
        setSending(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => sendAlert(pos.coords),
        () => sendAlert(null),
        { timeout: 5000 }
      );
    } else {
      sendAlert(null);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="sos-fab"
        aria-label="Emergency SOS"
        data-testid="sos-fab"
      >
        <ShieldAlert className="w-6 h-6" />
        <span className="sos-fab-label">SOS</span>
      </button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="bg-[#18181B] border-red-500/30" data-testid="sos-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-red-500" />
              Trigger Emergency Alert?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This immediately notifies your emergency contacts with your current location.
              Only use this in a genuine emergency. If you are in immediate danger, also call
              local emergency services.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Optional: add a short message (e.g. what's happening)"
            className="bg-zinc-800/50 border-zinc-700 text-white"
            data-testid="sos-message-input"
          />

          <AlertDialogFooter>
            <AlertDialogCancel
              className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
              data-testid="sos-cancel-btn"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleSOS();
              }}
              disabled={sending}
              className="bg-red-600 hover:bg-red-700 text-white"
              data-testid="sos-confirm-btn"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Send Emergency Alert'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EmergencySOS;
