import { useEffect } from "react";
import { io } from "socket.io-client";
import { useAuthStore } from "../store/auth.store";

const getSocketUrl = () => {
  const envUrl = import.meta.env.VITE_SOCKET_URL;
  if (envUrl) {
    return envUrl.startsWith('http') ? envUrl : window.location.origin;
  }
  return window.location.origin;
};

export const useSocket = (onEvent: (event: string, payload: any) => void) => {
  const gymId = useAuthStore((s) => s.gymId);

  useEffect(() => {
    const socketUrl = getSocketUrl();
    const socket = io(socketUrl, {
      query: { gymId },
      transports: ['websocket', 'polling']
    });
    
    socket.on("attendance:checkin", (data) => onEvent("attendance:checkin", data));
    socket.on("attendance:checkout", (data) => onEvent("attendance:checkout", data));
    socket.on("member:updated", (data) => onEvent("member:updated", data));
    
    return () => {
      socket.disconnect();
    };
  }, [gymId, onEvent]);
};
