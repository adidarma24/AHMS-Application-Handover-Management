import { useState, useRef, useEffect, useMemo } from "react";
import {
  LayoutDashboard,
  AppWindow,
  ClipboardList,
  CheckSquare,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  FileText,
  Zap,
  Search,
  Bell,
  ChevronDown,
  User,
  Check,
  ExternalLink,
  FilePlus,
} from "lucide-react";
import type { AppState, Role } from "../types";
import type { Page } from "../App";

interface NavItem {
  id: Page;
  label: string;
  icon: any;
  roles: Role[];
}

// Daftar menu disesuaikan dengan roles dari Layout lama Anda,
// namun menggunakan icon dari desain baru
const NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: [
      "Project Manager",
      "O&M Application Support",
      "Reviewer Teknis",
      "Business Owner",
      "Manager O&M",
      "System Administrator",
    ],
  },
  {
    id: "handover-form",
    label: "Ajukan Handover",
    icon: FilePlus,
    roles: ["Project Manager"],
  },
  {
    id: "my-applications",
    label: "Aplikasi Saya",
    icon: AppWindow,
    roles: [
      "Project Manager",
      "O&M Application Support",
      "Business Owner",
      "Manager O&M",
      "System Administrator",
    ],
  },
  {
    id: "review",
    label: "Review & Approval",
    icon: ClipboardList,
    roles: [
      "O&M Application Support",
      "Reviewer Teknis",
      "Business Owner",
      "Manager O&M",
    ],
  },
  {
    id: "action-items",
    label: "Action Items",
    icon: CheckSquare,
    roles: [
      "Project Manager",
      "O&M Application Support",
      "Reviewer Teknis",
      "Business Owner",
      "Manager O&M",
      "System Administrator",
    ],
  },
  {
    id: "documents",
    label: "Dokumen",
    icon: FileText,
    roles: [
      "Project Manager",
      "O&M Application Support",
      "Reviewer Teknis",
      "Business Owner",
      "Manager O&M",
      "System Administrator",
    ],
  },
  {
    id: "reports",
    label: "Laporan & Analytics",
    icon: BarChart3,
    roles: ["Manager O&M", "System Administrator", "Business Owner"],
  },
  {
    id: "master-data",
    label: "Master Data",
    icon: Settings,
    roles: ["System Administrator"],
  },
];

// Icon notifikasi mengikuti pola activityIcon di Dashboard.tsx (Aktivitas Terkini)
function notifIcon(action: string) {
  const a = action.toLowerCase();
  if (a.includes("setuju") || a.includes("accept") || a.includes("approve"))
    return "✅";
  if (a.includes("tolak") || a.includes("reject")) return "❌";
  if (a.includes("dokumen") || a.includes("upload")) return "📄";
  if (a.includes("overdue")) return "⚠️";
  if (a.includes("review")) return "✅";
  return "🔔";
}

interface CurrentUser {
  name: string;
  role: Role;
  email: string;
}

interface Props {
  appState: AppState;
  currentUser: CurrentUser;
  currentPage: Page;
  onNavigate: (page: Page, appId?: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export default function Layout({
  appState,
  currentUser,
  currentPage,
  onNavigate,
  onLogout,
  children,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Filter menu berdasarkan hak akses
  const visibleItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(currentUser.role),
  );

  // Menghitung inisial nama (Misal: "Ahmad Maulana" -> "AM")
  const userInitials = currentUser.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  // Notifikasi diambil dari data asli (history aplikasi), sama seperti
  // "Aktivitas Terkini" di Dashboard.tsx — bukan lagi data dummy statis
  const notifications = useMemo(() => {
    return appState.applications
      .flatMap((a) =>
        a.history.map((h) => ({ ...h, appName: a.name, appId: a.id })),
      )
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, 8);
  }, [appState.applications]);

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setShowNotif(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setShowProfile(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = () =>
    setReadIds(new Set(notifications.map((n) => n.id)));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ================= SIDEBAR ================= */}
      <aside
        className="fixed left-0 top-0 h-full bg-white border-r border-gray-200 flex flex-col z-30 transition-all duration-200"
        style={{ width: collapsed ? 56 : 240 }}
      >
        {/* Logo */}
        <div className="h-14 flex items-center px-3 border-b border-gray-200 gap-3 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <Zap size={16} className="text-white" />
          </div>
          {!collapsed && (
            <div>
              <div className="text-sm font-bold text-gray-900 leading-tight">
                AHMS
              </div>
              <div className="text-[10px] text-gray-400 leading-tight">
                Handover System
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {visibleItems.map((item) => {
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors duration-100 relative group
                  ${active ? "bg-indigo-50 text-indigo-600" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}
              >
                <item.icon size={17} className="shrink-0" />
                {!collapsed && <span>{item.label}</span>}

                {/* Tooltip untuk mode collapsed */}
                {collapsed && (
                  <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="p-2 border-t border-gray-200">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center py-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </aside>

      {/* ================= TOPBAR ================= */}
      <header
        className="fixed top-0 right-0 h-14 bg-white border-b border-gray-200 flex items-center px-5 gap-4 z-20 transition-all duration-200"
        style={{ left: collapsed ? 56 : 240 }}
      >
        {/* Search */}
        <div className="flex-1 max-w-sm relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Cari aplikasi, dokumen..."
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 placeholder:text-gray-400"
          />
        </div>

        <div className="flex-1" />

        {/* Notification bell + dropdown — sumber & format sama dengan Aktivitas Terkini */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setShowNotif((v) => !v);
              setShowProfile(false);
            }}
            className="relative p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 top-full mt-2 w-[360px] bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="text-sm font-bold text-gray-900">
                  Notifikasi
                </span>
                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      <Check size={11} /> Tandai semua dibaca
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                {notifications.map((n) => {
                  const isRead = readIds.has(n.id);
                  return (
                    <button
                      key={n.id}
                      onClick={() => {
                        setReadIds((s) => new Set([...s, n.id]));
                        setShowNotif(false);
                        onNavigate("app-detail", n.appId);
                      }}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${!isRead ? "bg-indigo-50/40" : ""}`}
                    >
                      <span className="text-base leading-none mt-0.5 shrink-0">
                        {notifIcon(n.action)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-xs leading-snug ${!isRead ? "text-gray-900 font-semibold" : "text-gray-600"}`}
                        >
                          <span className="font-medium">{n.appName}</span>: {n.action}
                          {n.user ? ` — ${n.user}` : ""}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {n.timestamp}
                        </p>
                      </div>
                      {!isRead && (
                        <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-1.5 shrink-0" />
                      )}
                    </button>
                  );
                })}
                {notifications.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-8">
                    Belum ada aktivitas
                  </p>
                )}
              </div>

              <div className="border-t border-gray-100 p-2">
                <button
                  onClick={() => {
                    setShowNotif(false);
                    onNavigate("dashboard");
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-indigo-600 font-medium hover:bg-indigo-50 rounded-xl transition-colors"
                >
                  Lihat semua aktivitas <ExternalLink size={11} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => {
              setShowProfile((v) => !v);
              setShowNotif(false);
            }}
            className="flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors text-left"
          >
            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
              {userInitials}
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-semibold text-gray-800 leading-tight">
                {currentUser.name}
              </div>
              <div className="text-[10px] text-gray-400 leading-tight">
                {currentUser.role}
              </div>
            </div>
            <ChevronDown
              size={14}
              className={`text-gray-400 transition-transform ${showProfile ? "rotate-180" : ""}`}
            />
          </button>

          {showProfile && (
            <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50">
              <div className="px-3 py-2 border-b border-gray-100 mb-1">
                <div className="text-xs font-semibold text-gray-800">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-gray-400">
                  {currentUser.email}
                </div>
              </div>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors">
                <User size={14} className="text-gray-400" /> Profil Saya
              </button>
              <hr className="my-1 border-gray-100" />
              {/* Tombol Logout */}
              <button
                onClick={onLogout}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                Keluar
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ================= MAIN CONTENT ================= */}
      <main
        className="transition-all duration-200 pt-14 h-screen flex flex-col"
        style={{ paddingLeft: collapsed ? 56 : 240 }}
      >
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </main>
    </div>
  );
}