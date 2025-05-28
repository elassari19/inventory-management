import { useEffect, useRef, useState, useCallback } from 'react';

// WebSocket connection states
export const ConnectionState = {
  Connecting: 'Connecting',
  Open: 'Open',
  Closing: 'Closing',
  Closed: 'Closed',
  Uninstantiated: 'Uninstantiated',
} as const;

export type ConnectionState =
  (typeof ConnectionState)[keyof typeof ConnectionState];

// WebSocket message types
export interface WebSocketMessage<T = any> {
  type: string;
  payload: T;
  timestamp: number;
  id?: string;
}

// WebSocket configuration
interface WebSocketConfig {
  url: string;
  protocols?: string | string[];
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  onMessage?: (message: WebSocketMessage) => void;
}

// Custom hook for WebSocket connections
export function useWebSocket<T = any>(config: WebSocketConfig) {
  const {
    url,
    protocols,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    heartbeatInterval = 30000,
    onConnect,
    onDisconnect,
    onError,
    onMessage,
  } = config;

  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.Uninstantiated
  );
  const [lastMessage, setLastMessage] = useState<WebSocketMessage<T> | null>(
    null
  );
  const [isConnected, setIsConnected] = useState(false);

  const websocketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>(undefined);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout>(undefined);
  const reconnectCountRef = useRef(0);

  // Send message function
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  // Send heartbeat
  const sendHeartbeat = useCallback(() => {
    sendMessage({
      type: 'heartbeat',
      payload: null,
      timestamp: Date.now(),
    });
  }, [sendMessage]);

  // Start heartbeat
  const startHeartbeat = useCallback(() => {
    if (heartbeatInterval > 0) {
      heartbeatTimeoutRef.current = setInterval(
        sendHeartbeat,
        heartbeatInterval
      );
    }
  }, [heartbeatInterval, sendHeartbeat]);

  // Stop heartbeat
  const stopHeartbeat = useCallback(() => {
    if (heartbeatTimeoutRef.current) {
      clearInterval(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = undefined;
    }
  }, []);

  // Connect function
  const connect = useCallback(() => {
    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionState(ConnectionState.Connecting);

    try {
      const ws = new WebSocket(url, protocols);
      websocketRef.current = ws;

      ws.onopen = () => {
        setConnectionState(ConnectionState.Open);
        setIsConnected(true);
        reconnectCountRef.current = 0;
        startHeartbeat();
        onConnect?.();
      };

      ws.onclose = () => {
        setConnectionState(ConnectionState.Closed);
        setIsConnected(false);
        stopHeartbeat();
        onDisconnect?.();

        // Attempt reconnection
        if (reconnectCountRef.current < maxReconnectAttempts) {
          reconnectCountRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = (error) => {
        setConnectionState(ConnectionState.Closed);
        setIsConnected(false);
        onError?.(error);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage<T> = JSON.parse(event.data);
          setLastMessage(message);
          onMessage?.(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionState(ConnectionState.Closed);
    }
  }, [
    url,
    protocols,
    reconnectInterval,
    maxReconnectAttempts,
    onConnect,
    onDisconnect,
    onError,
    onMessage,
    startHeartbeat,
    stopHeartbeat,
  ]);

  // Disconnect function
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    stopHeartbeat();

    if (websocketRef.current) {
      setConnectionState(ConnectionState.Closing);
      websocketRef.current.close();
      websocketRef.current = null;
    }
  }, [stopHeartbeat]);

  // Effect to establish connection
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      stopHeartbeat();
    };
  }, [stopHeartbeat]);

  return {
    connectionState,
    isConnected,
    lastMessage,
    sendMessage,
    connect,
    disconnect,
  };
}

// Real-time notifications hook
export function useRealtimeNotifications() {
  const [notifications, setNotifications] = useState<WebSocketMessage[]>([]);

  const { isConnected, lastMessage, sendMessage } = useWebSocket({
    url: process.env.VITE_WS_URL || 'ws://localhost:8080/ws',
    onMessage: (message) => {
      if (message.type === 'notification') {
        setNotifications((prev) => [message, ...prev.slice(0, 49)]); // Keep last 50
      }
    },
  });

  const subscribeToTenant = useCallback(
    (tenantId: string) => {
      sendMessage({
        type: 'subscribe',
        payload: { tenantId },
        timestamp: Date.now(),
      });
    },
    [sendMessage]
  );

  const unsubscribeFromTenant = useCallback(
    (tenantId: string) => {
      sendMessage({
        type: 'unsubscribe',
        payload: { tenantId },
        timestamp: Date.now(),
      });
    },
    [sendMessage]
  );

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId
          ? {
              ...notification,
              payload: { ...notification.payload, read: true },
            }
          : notification
      )
    );
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    isConnected,
    notifications,
    lastMessage,
    subscribeToTenant,
    unsubscribeFromTenant,
    markAsRead,
    clearNotifications,
  };
}

// Real-time metrics hook
export function useRealtimeMetrics() {
  const [metrics, setMetrics] = useState<Record<string, any>>({});

  const { isConnected, lastMessage } = useWebSocket({
    url: process.env.VITE_WS_METRICS_URL || 'ws://localhost:8080/metrics',
    onMessage: (message) => {
      if (message.type === 'metrics_update') {
        setMetrics((prev) => ({
          ...prev,
          ...message.payload,
        }));
      }
    },
  });

  return {
    isConnected,
    metrics,
    lastMessage,
  };
}

// Real-time inventory updates hook
export function useRealtimeInventory() {
  const [inventoryUpdates, setInventoryUpdates] = useState<WebSocketMessage[]>(
    []
  );

  const { isConnected, lastMessage, sendMessage } = useWebSocket({
    url: process.env.VITE_WS_INVENTORY_URL || 'ws://localhost:8080/inventory',
    onMessage: (message) => {
      if (
        ['stock_update', 'low_stock_alert', 'inventory_movement'].includes(
          message.type
        )
      ) {
        setInventoryUpdates((prev) => [message, ...prev.slice(0, 99)]); // Keep last 100
      }
    },
  });

  const subscribeToLocation = useCallback(
    (locationId: string) => {
      sendMessage({
        type: 'subscribe_location',
        payload: { locationId },
        timestamp: Date.now(),
      });
    },
    [sendMessage]
  );

  const subscribeToProduct = useCallback(
    (productId: string) => {
      sendMessage({
        type: 'subscribe_product',
        payload: { productId },
        timestamp: Date.now(),
      });
    },
    [sendMessage]
  );

  return {
    isConnected,
    inventoryUpdates,
    lastMessage,
    subscribeToLocation,
    subscribeToProduct,
  };
}
