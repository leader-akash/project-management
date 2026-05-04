"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";

export function Providers({ children }) {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("pm_theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", storedTheme ? storedTheme === "dark" : prefersDark);

    const onExpired = () => {
      logout();
      router.replace("/login");
    };

    window.addEventListener("auth:expired", onExpired);
    return () => window.removeEventListener("auth:expired", onExpired);
  }, [logout, router]);

  return children;
}

