import { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  AppWindow,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  ChevronRight,
  Flame,
} from "lucide-react";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import GoLiveCountdown from "../components/ui/GoLiveCountdown";
import {
  SkeletonKPICards,
  SkeletonChartCard,
  SkeletonTableRows,
} from "../components/ui/Skeleton";
import type { AppState, Role } from "../types";
import type { Page } from "../App";

interface Props {
  appState: AppState;
  currentUser: { name: string; role: Role };
  onNavigate: (page: Page, appId?: string) => void;
}

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agt",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];
const ANNUAL_TARGET = 100; // Disesuaikan dengan target di desain baru

export default function Dashboard({
  appState,
  currentUser,
  onNavigate,
}: Props) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sedikit diperlama loadingnya seperti desain baru
    const t = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  const apps = appState.applications;

  // Kalkulasi data dinamis (tetap dipertahankan)
  const kpi = useMemo(() => {
    const realisasi = apps.filter(
      (a) => a.status === "Handover Accepted",
    ).length;
    const backlog = apps.filter((a) =>
      ["Waiting for O&M Review", "Under Technical Review", "Draft"].includes(
        a.status,
      ),
    ).length;
    const overdueCount = apps.reduce(
      (sum, a) =>
        sum + a.actionItems.filter((ai) => ai.status === "overdue").length,
      0,
    );
    const highRiskCount = apps.filter((a) => a.riskScore >= 50).length;
    return { realisasi, backlog, overdueCount, highRiskCount };
  }, [apps]);

  // KPI Cards dengan warna baru (Indigo theme)
  const kpiCards = [
    {
      label: "Total Target Handover",
      value: ANNUAL_TARGET,
      sub: `Tahun ${new Date().getFullYear()}`,
      icon: AppWindow,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "Realisasi",
      value: kpi.realisasi,
      sub: `${Math.round((kpi.realisasi / ANNUAL_TARGET) * 100)}% dari target`,
      icon: CheckCircle,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Backlog",
      value: kpi.backlog,
      sub: "Belum selesai",
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Action Item Overdue",
      value: kpi.overdueCount,
      sub: "Perlu segera ditangani",
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      label: "Aplikasi Berisiko Tinggi",
      value: kpi.highRiskCount,
      sub: "Butuh perhatian",
      icon: TrendingUp,
      color: "text-red-600",
      bg: "bg-red-50",
    },
  ];

  const statusDist = useMemo(() => {
    const map: Record<string, number> = {};
    apps.forEach((a) => {
      map[a.status] = (map[a.status] || 0) + 1;
    });
    return Object.entries(map).map(([status, count]) => ({ status, count }));
  }, [apps]);

  const monthlyData = useMemo(() => {
    return MONTH_LABELS.map((label, idx) => {
      const month = idx + 1;
      const submitted = apps.filter(
        (a) => new Date(a.submittedDate).getMonth() + 1 === month,
      ).length;
      const accepted = apps.filter(
        (a) =>
          a.status === "Handover Accepted" &&
          new Date(a.goLiveDate).getMonth() + 1 === month,
      ).length;
      // Target per bulan statis disesuaikan dengan contoh line chart baru (8)
      return { month: label, realisasi: accepted, target: 8, submitted };
    });
  }, [apps]);

  const pieData = useMemo(() => {
    const done = kpi.realisasi;
    const remaining = Math.max(ANNUAL_TARGET - done, 0);
    return [
      { name: "Selesai", value: done, color: "#10b981" },
      { name: "Backlog", value: remaining, color: "#e5e7eb" },
    ];
  }, [kpi.realisasi]);

  const progressPct = Math.round((kpi.realisasi / ANNUAL_TARGET) * 100) || 0;

  const attentionApps = useMemo(() => {
    return apps
      .filter(
        (a) =>
          a.riskScore >= 50 ||
          a.status === "Rejected" ||
          a.actionItems.some((ai) => ai.status === "overdue"),
      )
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 5); // Dibatasi 5 seperti contoh baru
  }, [apps]);

  const activity = useMemo(() => {
    return apps
      .flatMap((a) =>
        a.history.map((h) => ({ ...h, appName: a.name, appId: a.id })),
      )
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, 7);
  }, [apps]);

  const activityIcon = (action: string) => {
    const a = action.toLowerCase();
    if (a.includes("setuju") || a.includes("accept") || a.includes("approve"))
      return "✅";
    if (a.includes("tolak") || a.includes("reject")) return "❌";
    if (a.includes("dokumen") || a.includes("upload")) return "📄";
    if (a.includes("overdue")) return "⚠️";
    if (a.includes("review")) return "✅";
    return "🔔";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-32 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-4 w-64 bg-gray-100 rounded-lg animate-pulse" />
          </div>
          <div className="h-9 w-40 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        {/* <SkeletonKPICards count={5} /> */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <SkeletonChartCard height={130} />
          <SkeletonChartCard height={130} />
          <SkeletonChartCard height={130} />
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
            </div>
            <table className="w-full">
              <tbody>
                <SkeletonTableRows rows={5} cols={5} />
              </tbody>
            </table>
          </div>
          <SkeletonChartCard height={200} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Selamat pagi, {currentUser.name}. Berikut ringkasan handover
            aplikasi hari ini.
          </p>
        </div>
        {currentUser.role === "Project Manager" && (
          <Button onClick={() => onNavigate("handover-form")}>
            + Ajukan Handover Baru
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        {kpiCards.map((k) => (
          <Card key={k.label} className="flex items-start gap-3">
            <div
              className={`w-9 h-9 rounded-lg ${k.bg} flex items-center justify-center flex-shrink-0`}
            >
              <k.icon size={17} className={k.color} />
            </div>
            <div>
              <div className={`text-2xl font-bold font-mono ${k.color}`}>
                {k.value}
              </div>
              <div className="text-xs font-medium text-gray-700 mt-0.5">
                {k.label}
              </div>
              <div className="text-xs text-gray-400">{k.sub}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Donut */}
        <Card className="flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Progress Handover
              </h3>
              <p className="text-xs text-gray-400">
                Realisasi vs Target {new Date().getFullYear()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <PieChart width={120} height={120}>
              <Pie
                data={pieData}
                dataKey="value"
                innerRadius={36}
                outerRadius={55}
                startAngle={90}
                endAngle={-270}
              >
                {pieData.map((e, i) => (
                  <Cell key={i} fill={e.color} strokeWidth={0} />
                ))}
              </Pie>
            </PieChart>
            <div className="space-y-2">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: d.color }}
                  />
                  <span className="text-xs text-gray-600">{d.name}</span>
                  <span className="text-sm font-bold font-mono text-gray-900 ml-auto">
                    {d.value}
                  </span>
                </div>
              ))}
              <div className="pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-400">
                  Progress keseluruhan
                </span>
                <div className="text-xl font-bold text-indigo-600 font-mono">
                  {progressPct}%
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Bar chart - Menggunakan warna Indigo #4f46e5 */}
        <Card>
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900">
              Aplikasi per Status
            </h3>
            <p className="text-xs text-gray-400">Distribusi status saat ini</p>
          </div>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={statusDist} barSize={24}>
              <XAxis
                dataKey="status"
                tick={{ fontSize: 9, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={-15}
                textAnchor="end"
                height={30}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                width={24}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
                cursor={{ fill: "#f3f4f6" }}
              />
              <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Line chart - Menggunakan warna Indigo #4f46e5 */}
        <Card>
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900">
              Tren Handover Bulanan
            </h3>
            <p className="text-xs text-gray-400">
              Realisasi vs target per bulan
            </p>
          </div>
          <ResponsiveContainer width="100%" height={130}>
            <LineChart data={monthlyData}>
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                width={24}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
              />
              <Line
                type="monotone"
                dataKey="realisasi"
                stroke="#4f46e5"
                strokeWidth={2}
                dot={{ r: 3, fill: "#4f46e5" }}
                name="Realisasi"
              />
              <Line
                type="monotone"
                dataKey="target"
                stroke="#e5e7eb"
                strokeWidth={2}
                strokeDasharray="4 2"
                dot={false}
                name="Target"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Attention cards — ala ITSM "Needs Attention": kartu + countdown live, bukan tabel statis */}
        <div className="xl:col-span-2">
          <Card padding={false}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                  <Flame size={14} className="text-red-500" />
                  Aplikasi Perlu Perhatian
                </h3>
                <p className="text-xs text-gray-400">
                  Risiko tinggi, ditolak, atau punya action item overdue
                </p>
              </div>
              <button
                onClick={() => onNavigate("my-applications")}
                className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
              >
                Lihat semua <ChevronRight size={12} />
              </button>
            </div>

            <div className="p-4">
              {attentionApps.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {attentionApps.map((app) => {
                    const overdueCount = app.actionItems.filter(
                      (ai) => ai.status === "overdue",
                    ).length;
                    return (
                      <button
                        key={app.id}
                        onClick={() => onNavigate("app-detail", app.id)}
                        className={`text-left rounded-xl border p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${
                          overdueCount > 0
                            ? "border-red-200 bg-red-50/30"
                            : "border-gray-200 bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2.5">
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 text-sm truncate">
                              {app.name}
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">
                              {app.pic}
                            </div>
                          </div>
                          <Badge
                            variant={
                              app.status
                                .toLowerCase()
                                .replace(/\s+/g, "") as any
                            }
                          >
                            {app.status}
                          </Badge>
                        </div>

                        <GoLiveCountdown
                          goLiveDate={app.goLiveDate}
                          className="mb-2.5"
                        />

                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={app.criticality.toLowerCase() as any}>
                            {app.criticality}
                          </Badge>
                          {overdueCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600">
                              <AlertTriangle size={11} /> {overdueCount} overdue
                            </span>
                          )}
                          <span
                            className={`ml-auto text-xs font-bold font-mono flex-shrink-0 ${
                              app.riskScore >= 70
                                ? "text-red-600"
                                : app.riskScore >= 50
                                  ? "text-amber-600"
                                  : "text-gray-400"
                            }`}
                          >
                            Risk {app.riskScore}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="px-1 py-8 text-center text-gray-400 text-xs">
                  Tidak ada aplikasi yang butuh perhatian saat ini
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Activity feed */}
        <Card className="flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">
              Aktivitas Terkini
            </h3>
            <button className="text-xs text-indigo-600 hover:underline">
              Semua
            </button>
          </div>
          <div className="space-y-3 overflow-y-auto flex-1">
            {activity.map((a, i) => (
              <button
                key={i}
                onClick={() => onNavigate("app-detail", a.appId)}
                className="flex gap-3 text-xs text-left w-full hover:bg-gray-50 -mx-1 px-1 py-1 rounded-md"
              >
                <span className="text-base leading-none mt-0.5 flex-shrink-0">
                  {activityIcon(a.action)}
                </span>
                <div>
                  <p className="text-gray-700 leading-snug">
                    <span className="font-medium">{a.appName}</span>: {a.action}
                    {a.user ? ` — ${a.user}` : ""}
                  </p>
                  <p className="text-gray-400 mt-0.5">{a.timestamp}</p>
                </div>
              </button>
            ))}
            {activity.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-6">
                Belum ada aktivitas
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}