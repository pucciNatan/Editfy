// src/hooks/useWebSocket.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { authStorage } from '@/lib/authStorage';

interface WebSocketMessage {
  event: string;
  [key: string]: any;
}
interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  baseDelayMs?: number;
  maxRetries?: number;
}

export function useWebSocket(rawUrl: string, opts?: UseWebSocketOptions) {
  const baseDelayMs = opts?.baseDelayMs ?? 1000;
  const maxRetries  = opts?.maxRetries  ?? 6;

  const onMessageRef    = useRef(opts?.onMessage);
  const onConnectRef    = useRef(opts?.onConnect);
  const onDisconnectRef = useRef(opts?.onDisconnect);
  const onErrorRef      = useRef(opts?.onError);
  useEffect(() => { onMessageRef.current = opts?.onMessage; },   [opts?.onMessage]);
  useEffect(() => { onConnectRef.current = opts?.onConnect; },   [opts?.onConnect]);
  useEffect(() => { onDisconnectRef.current = opts?.onDisconnect; }, [opts?.onDisconnect]);
  useEffect(() => { onErrorRef.current = opts?.onError; },       [opts?.onError]);

  const wsRef         = useRef<WebSocket | null>(null);
  const retriesRef    = useRef(0);
  const timerRef      = useRef<number | null>(null);
  const closingRef    = useRef(false);
  const connectingRef = useRef(false);
  const [isConnected, setIsConnected] = useState(false);

  const clearTimer = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const scheduleReconnect = () => {
    if (retriesRef.current >= maxRetries || closingRef.current) return;
    const delay = Math.min(baseDelayMs * Math.pow(2, retriesRef.current), 8000);
    retriesRef.current += 1;
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      connect();
    }, delay) as unknown as number;
  };

  const connect = useCallback(() => {
    if (connectingRef.current || closingRef.current) return;
    connectingRef.current = true;

    try {
      const token = authStorage.getAccess() ?? '';
      const protocols = token ? ["Bearer", token] : undefined;
      const ws = protocols ? new WebSocket(rawUrl, protocols) : new WebSocket(rawUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        connectingRef.current = false;
        retriesRef.current = 0;
        setIsConnected(true);
        onConnectRef.current?.();
      };

      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data) as WebSocketMessage;
          onMessageRef.current?.(data);
        } catch {}
      };

      ws.onerror = (e) => {
        onErrorRef.current?.(e);
      };

      ws.onclose = () => {
        setIsConnected(false);
        onDisconnectRef.current?.();
        connectingRef.current = false;
        if (!closingRef.current) scheduleReconnect();
      };
    } catch (e) {
      connectingRef.current = false;
      onErrorRef.current?.(e as Event);
      scheduleReconnect();
    }
  }, [rawUrl]);

  useEffect(() => {
    closingRef.current = false;
    connect();
    return () => {
      closingRef.current = true;
      clearTimer();
      try { wsRef.current?.close(); } catch {}
    };
  }, [connect]);

  const sendMessage = useCallback((payload: any) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  }, []);

  return { isConnected, sendMessage };
}
