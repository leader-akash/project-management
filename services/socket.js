"use client";

import { io } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

let socket = null;
let currentToken = null;
const joinedProjects = new Set();

function rejoinProjects() {
  if (!socket?.connected) return;
  joinedProjects.forEach((projectId) => {
    socket.emit("project:join", { projectId });
  });
}

export function connectSocket(token) {
  if (!token || typeof window === "undefined") return null;

  if (socket && currentToken === token) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
  }

  currentToken = token;
  socket = io(SOCKET_URL, {
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
    reconnectionDelayMax: 5000,
    transports: ["websocket", "polling"]
  });

  socket.on("connect", rejoinProjects);
  socket.io.on("reconnect", rejoinProjects);

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  joinedProjects.clear();
  currentToken = null;
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function joinProject(projectId) {
  if (!projectId) return;
  joinedProjects.add(projectId);
  if (socket?.connected) {
    socket.emit("project:join", { projectId });
  }
}

export function leaveProject(projectId) {
  if (!projectId) return;
  joinedProjects.delete(projectId);
  if (socket?.connected) {
    socket.emit("project:leave", { projectId });
  }
}

export function onSocketEvent(event, handler) {
  if (!socket) return () => {};
  socket.on(event, handler);
  return () => socket?.off(event, handler);
}

