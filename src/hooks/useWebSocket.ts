import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  WebSocketMessage,
  APIVisitorEvent,
  StatsResponse,
  FaceRecognitionData,
  UnknownFaceData,
} from '@/types/api';
import { runtimeConfig } from '@/config/runtime';

const WS_URL =
  runtimeConfig.VITE_WS_URL === 'auto'
    ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`
    : runtimeConfig.VITE_WS_URL;

// Debug logging for WebSocket environment variables
console.log('WebSocket Environment Variables:', {
  VITE_WS_URL: runtimeConfig.VITE_WS_URL,
  WS_URL,
  window_location: window.location.href,
  protocol: window.location.protocol,
  host: window.location.host,
  runtimeConfig,
});

interface UseWebSocketReturn {
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastMessage: WebSocketMessage | null;
  sendMessage: (message: Record<string, unknown>) => void;
}

export const useWebSocket = (
  onNewVisitor?: (visitor: APIVisitorEvent) => void,
  onStatsUpdate?: (stats: StatsResponse) => void,
  onDatabaseCleared?: () => void,
  onFaceRecognized?: (data: FaceRecognitionData) => void,
  onUnknownFaceDetected?: (data: UnknownFaceData) => void
): UseWebSocketReturn => {
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout>();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected' | 'error'
  >('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const isConnecting = useRef(false);

  // Memoize callbacks to prevent unnecessary reconnections
  const memoizedOnNewVisitor = useMemo(() => onNewVisitor, [onNewVisitor]);
  const memoizedOnStatsUpdate = useMemo(() => onStatsUpdate, [onStatsUpdate]);
  const memoizedOnDatabaseCleared = useMemo(
    () => onDatabaseCleared,
    [onDatabaseCleared]
  );
  const memoizedOnFaceRecognized = useMemo(
    () => onFaceRecognized,
    [onFaceRecognized]
  );
  const memoizedOnUnknownFaceDetected = useMemo(
    () => onUnknownFaceDetected,
    [onUnknownFaceDetected]
  );

  const cleanup = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = undefined;
    }
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    isConnecting.current = false;
  }, []);

  const connect = useCallback(() => {
    // Prevent multiple simultaneous connections
    if (isConnecting.current || ws.current?.readyState === WebSocket.OPEN) {
      return;
    }

    isConnecting.current = true;
    setConnectionStatus('connecting');

    console.log('Attempting WebSocket connection to:', WS_URL);

    try {
      ws.current = new WebSocket(WS_URL);

      ws.current.onopen = () => {
        console.log('WebSocket connected successfully to:', WS_URL);
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttempts.current = 0;
        isConnecting.current = false;
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          console.log('WebSocket message received:', message);

          switch (message.type) {
            case 'new_visitor':
              memoizedOnNewVisitor?.(message.data as APIVisitorEvent);
              break;
            case 'stats_update':
              memoizedOnStatsUpdate?.(message.data as StatsResponse);
              break;
            case 'database_cleared':
              memoizedOnDatabaseCleared?.();
              break;
            case 'face_recognized':
              memoizedOnFaceRecognized?.(message.data as FaceRecognitionData);
              break;
            case 'unknown_face_detected':
              memoizedOnUnknownFaceDetected?.(message.data as UnknownFaceData);
              break;
            case 'connection_status':
              console.log('Connection status:', message.data);
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onclose = (event) => {
        console.log('WebSocket disconnected:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          url: WS_URL,
        });
        setIsConnected(false);
        setConnectionStatus('disconnected');
        isConnecting.current = false;

        // Only attempt to reconnect if it wasn't a manual close
        if (
          event.code !== 1000 &&
          reconnectAttempts.current < maxReconnectAttempts
        ) {
          const delay = Math.min(
            Math.pow(2, reconnectAttempts.current) * 1000,
            30000
          );
          console.log(
            `Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`
          );
          reconnectTimeout.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', {
          error,
          url: WS_URL,
          readyState: ws.current?.readyState,
        });
        setConnectionStatus('error');
        isConnecting.current = false;
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionStatus('error');
      isConnecting.current = false;
    }
  }, [
    memoizedOnNewVisitor,
    memoizedOnStatsUpdate,
    memoizedOnDatabaseCleared,
    memoizedOnFaceRecognized,
    memoizedOnUnknownFaceDetected,
  ]);

  const sendMessage = useCallback((message: Record<string, unknown>) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  }, []);

  useEffect(() => {
    connect();
    return cleanup;
  }, [cleanup, connect]);

  return {
    isConnected,
    connectionStatus,
    lastMessage,
    sendMessage,
  };
};
