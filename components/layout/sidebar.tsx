"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  Activity,
  CalendarCheck,
  ClipboardList,
  Bell,
  Users,
  UserCog,
  GraduationCap,
  BarChart3,
  LogOut,
  ChevronRight,
  FolderOpen,
  TrendingUp,
  AlertTriangle,
  FileCheck,
  Upload,
} from "lucide-react";
import { signOut } from "next-auth/react";
import type { Role } from "@prisma/client";

const navConfig: Record<Role, { label: string; href: string; icon: React.ElementType }[]> = {
  PARENT: [
    { label: "Dashboard", href: "/parent", icon: LayoutDashboard },
    { label: "Subjects & Marks", href: "/parent/subjects", icon: BookOpen },
    { label: "Progress", href: "/parent/progress", icon: TrendingUp },
    { label: "Behaviour", href: "/parent/behaviour", icon: Activity },
    { label: "Attendance", href: "/parent/attendance", icon: CalendarCheck },
    { label: "Assessments", href: "/parent/assessments", icon: FileCheck },
    { label: "Class Materials", href: "/parent/materials", icon: FolderOpen },
    { label: "Homework", href: "/parent/homework", icon: Upload },
    { label: "Incidents", href: "/parent/incidents", icon: AlertTriangle },
    { label: "Deadlines", href: "/parent/deadlines", icon: ClipboardList },
    { label: "Notices", href: "/parent/notices", icon: Bell },
  ],
  TEACHER: [
    { label: "Dashboard", href: "/teacher", icon: LayoutDashboard },
    { label: "Enter Marks", href: "/teacher/marks", icon: BookOpen },
    { label: "Assignments", href: "/teacher/assignments", icon: ClipboardList },
    { label: "Behaviour", href: "/teacher/behaviour", icon: Activity },
    { label: "Attendance", href: "/teacher/attendance", icon: CalendarCheck },
    { label: "Progress", href: "/teacher/progress", icon: TrendingUp },
    { label: "Class Materials", href: "/teacher/materials", icon: FolderOpen },
    { label: "Incidents", href: "/teacher/incidents", icon: AlertTriangle },
    { label: "Deadlines", href: "/teacher/deadlines", icon: ClipboardList },
    { label: "Notices", href: "/teacher/notices", icon: Bell },
  ],
  ADMIN: [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Teachers", href: "/admin/teachers", icon: UserCog },
    { label: "Students", href: "/admin/students", icon: Users },
    { label: "Behaviour", href: "/admin/behaviour", icon: Activity },
    { label: "Attendance", href: "/admin/attendance", icon: BarChart3 },
    { label: "Assessments", href: "/admin/assessments", icon: FileCheck },
    { label: "Incidents", href: "/admin/incidents", icon: AlertTriangle },
  ],
};

interface SidebarProps {
  role: Role;
  userName: string;
}

export function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();
  const items = navConfig[role];

  const roleLabel = role === "PARENT" ? "Parent" : role === "TEACHER" ? "Teacher" : "Admin";
  const roleColor =
    role === "PARENT" ? "bg-blue-100 text-blue-700" :
    role === "TEACHER" ? "bg-emerald-100 text-emerald-700" :
    "bg-purple-100 text-purple-700";

  return (
    <aside className="sidebar flex h-screen flex-col border-r border-slate-200 bg-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-200">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-800">
          <GraduationCap className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">LTP Centre</p>
          <p className="text-xs text-slate-500">Learning Portal</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {items.map((item) => {
            const isActive = pathname === item.href || (item.href !== `/${role.toLowerCase()}` && pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-800 text-white"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {item.label}
                  {isActive && <ChevronRight className="ml-auto h-3 w-3" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User footer */}
      <div className="border-t border-slate-200 p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">{userName}</p>
            <span className={cn("inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium", roleColor)}>
              {roleLabel}
            </span>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
