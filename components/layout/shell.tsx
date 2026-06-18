"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "./sidebar";
import { cn } from "@/lib/utils";
import type { Role } from "@prisma/client";

interface ShellProps {
  role: Role;
  userName: string;
  children: React.ReactNode;
}

export function Shell({ role, userName, children }: ShellProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-full">
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar — always visible on md+, drawer on mobile */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 transition-transform duration-200 md:relative md:translate-x-0 md:block",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <Sidebar role={role} userName={userName} onClose={() => setOpen(false)} />
      </div>

      {/* Main area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 md:hidden">
          <button
            aria-label="Open menu"
            onClick={() => setOpen(true)}
            className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-slate-900">LTP Centre</span>
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
