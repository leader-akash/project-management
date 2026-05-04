"use client";

import { create } from "zustand";
import { authApi } from "@/services/api";
import { connectSocket, disconnectSocket } from "@/services/socket";

function persistSession(token, user) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("pm_token", token);
  window.localStorage.setItem("pm_user", JSON.stringify(user));
}

function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("pm_token");
  window.localStorage.removeItem("pm_user");
}

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isReady: false,
  isLoading: false,
  error: null,

  bootstrap: async () => {
    if (get().isReady || typeof window === "undefined") return;

    const token = window.localStorage.getItem("pm_token");
    const cachedUser = window.localStorage.getItem("pm_user");

    if (!token) {
      set({ isReady: true });
      return;
    }

    set({
      token,
      user: cachedUser ? JSON.parse(cachedUser) : null,
      isLoading: true
    });
    connectSocket(token);

    try {
      const { user } = await authApi.me();
      persistSession(token, user);
      set({ user, isReady: true, isLoading: false, error: null });
    } catch (error) {
      clearSession();
      disconnectSocket();
      set({ user: null, token: null, isReady: true, isLoading: false, error: error.message });
    }
  },

  login: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const { token, user } = await authApi.login(payload);
      persistSession(token, user);
      connectSocket(token);
      set({ token, user, isReady: true, isLoading: false });
      return user;
    } catch (error) {
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  register: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const { token, user } = await authApi.register(payload);
      persistSession(token, user);
      connectSocket(token);
      set({ token, user, isReady: true, isLoading: false });
      return user;
    } catch (error) {
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  logout: () => {
    clearSession();
    disconnectSocket();
    set({ user: null, token: null, isReady: true, error: null });
  }
}));

