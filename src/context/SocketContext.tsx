import { createContext, useEffect, useState, ReactNode } from "react";

interface SocketContextType {
  socket: WebSocket | null;
}

export const SocketContext = createContext<SocketContextType>({ socket: null });

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_SERVER_URL || "ws://localhost:8080";
    const newSocket = new WebSocket(wsUrl);
    setSocket(newSocket);

    newSocket.onopen = () => {
      console.log("Connected to server");
    };

    newSocket.onclose = () => {
      console.log("Disconnected from server");
      setSocket(null);
    };

    newSocket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};