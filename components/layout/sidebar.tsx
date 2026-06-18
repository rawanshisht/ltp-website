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
  AlertTriangle,
  FileCheck,
  Upload,
  FileText,
  Settings,
} from "lucide-react";
import { signOut } from "next-auth/react";
import type { Role } from "@prisma/client";
import { AppTour } from "@/components/tour/app-tour";

const navConfig: Record<Role, { label: string; href: string; icon: React.ElementType }[]> = {
  PARENT: [
    { label: "Dashboard", href: "/parent", icon: LayoutDashboard },
    { label: "Subjects & Marks", href: "/parent/subjects", icon: BookOpen },
    { label: "Behaviour", href: "/parent/behaviour", icon: Activity },
    { label: "Attendance", href: "/parent/attendance", icon: CalendarCheck },
    { label: "Assessments", href: "/parent/assessments", icon: FileCheck },
    { label: "Reports", href: "/parent/reports", icon: FileText },
    { label: "Class Materials", href: "/parent/materials", icon: FolderOpen },
    { label: "Homework", href: "/parent/homework", icon: Upload },
    { label: "Deadlines", href: "/parent/deadlines", icon: ClipboardList },
    { label: "Notices", href: "/parent/notices", icon: Bell },
    { label: "Incidents", href: "/parent/incidents", icon: AlertTriangle },
    { label: "Settings", href: "/parent/settings", icon: Settings },
  ],
  TEACHER: [
    { label: "Dashboard", href: "/teacher", icon: LayoutDashboard },
    { label: "Enter Marks", href: "/teacher/marks", icon: BookOpen },
    { label: "Assignments", href: "/teacher/assignments", icon: ClipboardList },
    { label: "Behaviour", href: "/teacher/behaviour", icon: Activity },
    { label: "Attendance", href: "/teacher/attendance", icon: CalendarCheck },
    { label: "Class Materials", href: "/teacher/materials", icon: FolderOpen },
    { label: "Reports", href: "/teacher/reports", icon: FileText },
    { label: "Deadlines", href: "/teacher/deadlines", icon: ClipboardList },
    { label: "Notices", href: "/teacher/notices", icon: Bell },
    { label: "Incidents", href: "/teacher/incidents", icon: AlertTriangle },
    { label: "Settings", href: "/teacher/settings", icon: Settings },
  ],
  ADMIN: [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Teachers", href: "/admin/teachers", icon: UserCog },
    { label: "Students", href: "/admin/students", icon: Users },
    { label: "Behaviour", href: "/admin/behaviour", icon: Activity },
    { label: "Attendance", href: "/admin/attendance", icon: BarChart3 },
    { label: "Assessments", href: "/admin/assessments", icon: FileCheck },
    { label: "Incidents", href: "/admin/incidents", icon: AlertTriangle },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ],
};

interface SidebarProps {
  role: Role;
  userName: string;
  onClose?: () => void;
}

export function Sidebar({ role, userName, onClose }: SidebarProps) {
  const pathname = usePathname();
  const items = navConfig[role];

  const roleLabel = role === "PARENT" ? "Parent Portal" : role === "TEACHER" ? "Teacher Portal" : "Admin Portal";
  const roleBg =
    role === "PARENT" ? "bg-cyan-500" :
      role === "TEACHER" ? "bg-orange-500" :
        "bg-pink-500";

  return (
    <aside id="tour-sidebar" className="sidebar flex h-screen h-dvh flex-col border-r border-slate-200 bg-white">
      {/* Portal banner */}
      <div className={cn("px-4 py-2 text-center", roleBg)}>
        <p className="text-xs font-semibold tracking-wide text-white uppercase">{roleLabel}</p>
      </div>

      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#00dcde]">
          <GraduationCap className="h-5 w-5 text-[#0f172a]" />
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
                  id={`tour-nav-${item.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[#00dcde] text-[#0f172a]"
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
      <div id="tour-user-section" className="border-t border-slate-200 p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">{userName}</p>
          </div>
        </div>
        <AppTour role={role} />
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
