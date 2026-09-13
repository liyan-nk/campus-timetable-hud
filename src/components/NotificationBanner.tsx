'use client';

import React, { useState, useEffect } from 'react';
import { Bell, BellOff, X, Check, Info } from 'lucide-react';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function NotificationBanner() {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('granted');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPermission('unsupported');
      return;
    }

    setPermission(Notification.permission);
  }, []);

  const handleEnableNotifications = async () => {
    if (typeof window === 'undefined') return;

    try {
      setIsSubmitting(true);
      setStatusMessage(null);

      const resPermission = await Notification.requestPermission();
      setPermission(resPermission);

      if (resPermission !== 'granted') {
        setStatusMessage('Permission was not granted');
        return;
      }

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.warn('VAPID Public Key missing');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        const convertedKey = urlBase64ToUint8Array(vapidPublicKey);
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey,
        });
      }

      // Sync subscription payload with backend
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription }),
      });

      setStatusMessage('Web Push Notifications Enabled!');
      setTimeout(() => setIsDismissed(true), 2500);
    } catch (err: any) {
      console.warn('Failed to enable push notifications:', err);
      setStatusMessage(err.message || 'Error subscribing to notifications');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isDismissed || permission === 'granted' || permission === 'unsupported') {
    return null;
  }

  return (
    <div className="bg-emerald-950/90 border border-emerald-800/80 text-emerald-100 p-3.5 rounded-2xl shadow-xl transition-all font-sans text-xs space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          {permission === 'denied' ? (
            <BellOff className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <Bell className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 animate-bounce" />
          )}
          <div>
            <h4 className="font-mono font-bold uppercase tracking-wider text-emerald-300 text-[11px]">
              {permission === 'denied' ? 'NOTIFICATIONS BLOCKED' : 'EMERGENCY PUSH ALERTS'}
            </h4>
            <p className="text-emerald-100/90 leading-relaxed mt-0.5">
              {permission === 'denied'
                ? 'Push notifications are blocked in your browser settings. To receive live CR class swap & cancellation alerts, unblock notifications for this site.'
                : 'Enable emergency notifications to receive real-time class swaps, room changes, and CR announcements.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsDismissed(true)}
          className="p-1 rounded bg-emerald-900/60 hover:bg-emerald-900 text-emerald-300 hover:text-white shrink-0 border border-emerald-800"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {statusMessage && (
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-300 bg-emerald-900/40 p-1.5 rounded-lg border border-emerald-800/50">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {permission === 'default' && (
        <div className="pt-1 flex justify-end">
          <button
            disabled={isSubmitting}
            onClick={handleEnableNotifications}
            className="px-3.5 py-1.5 rounded-xl font-mono font-bold text-xs bg-emerald-400 hover:bg-emerald-300 text-zinc-950 shadow-md transition-all flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'ENABLING...' : 'ENABLE ALERTS'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
