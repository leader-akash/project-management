"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FolderKanban, LayoutDashboard, LogOut, Shield } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { formatWorkspaceRole, isWorkspaceAdmin } from "@/lib/workspace";
import { useAuthStore } from "@/store/auth-store";

const baseNavItems = [{ href: "/dashboard", label: "Projects", icon: LayoutDashboard }];

export function AppShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navItems = isWorkspaceAdmin(user)
    ? [...baseNavItems, { href: "/admin", label: "Admin", icon: Shield }]
    : baseNavItems;

  const onLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <div className="flex h-dvh max-h-dvh w-full max-w-full min-w-0 flex-col overflow-hidden">
      <aside className="hidden h-dvh w-[260px] flex-col overflow-hidden border-r bg-card shadow-sm lg:fixed lg:left-0 lg:top-0 lg:z-30 lg:flex">
        <div className="flex h-14 shrink-0 items-center gap-3 px-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <FolderKanban className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">ProjectFlow</p>
            <p className="text-xs text-muted-foreground">Internal workspace</p>
          </div>
        </div>
        <Separator className="shrink-0" />
        <nav className="shrink-0 space-y-1 p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground",
                  active && "bg-muted text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto shrink-0 border-t bg-muted/30 p-3">
          <div className="mb-3 flex items-center gap-3 rounded-md bg-muted/60 p-3">
            <Avatar name={user?.name} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user?.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
              {user?.role ? (
                <p className="truncate text-[11px] text-muted-foreground/80">{formatWorkspaceRole(user.role)}</p>
              ) : null}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <ThemeToggle />
            <Button type="button" variant="ghost" size="icon" onClick={onLogout} title="Log out">
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Log out</span>
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:pl-[260px]">
        <header className="z-20 flex h-14 shrink-0 items-center justify-between border-b bg-background px-4 backdrop-blur lg:hidden">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <FolderKanban className="h-5 w-5 text-primary" />
            ProjectFlow
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button type="button" variant="ghost" size="icon" onClick={onLogout} title="Log out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain p-4 sm:p-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

