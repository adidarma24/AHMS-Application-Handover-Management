import { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LabelList,
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
import type { AppState, AppStatus, Role } from "../types";
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

// Urutan alur status (mengikuti definisi AppStatus di types.ts) + pemetaan
// warna semantik. Dipakai bersama oleh Badge (di kartu "Perlu Perhatian")
// dan chart distribusi status, supaya warnanya konsisten di satu halaman —
// sebelumnya Badge di kartu "Perlu Perhatian" salah mapping (spasi dibuang
// dari status sehingga "Waiting for O&M Review" / "Handover Accepted" jatuh
// ke style default abu-abu, bukan warna semantiknya).
const STATUS_ORDER: AppStatus[] = [
  "Draft",
  "Waiting for O&M Review",
  "Under Technical Review",
  "Rejected",
  "Approved",
  "Handover Accepted",
];
const STATUS_BADGE_VARIANT: Record<AppStatus, string> = {
  Draft: "draft",
  "Waiting for O&M Review": "waiting",
  "Under Technical Review": "inprogress",
  Rejected: "rejected",
  Approved: "approved",
  "Handover Accepted": "accepted",
};
const STATUS_SHORT_LABEL: Record<AppStatus, string> = {
  Draft: "Draft",
  "Waiting for O&M Review": "Waiting O&M",
  "Under Technical Review": "Review Teknis",
  Rejected: "Ditolak",
  Approved: "Approved",
  "Handover Accepted": "Accepted",
};
const BADGE_HEX: Record<string, string> = {
  draft: "#9CA3AF",
  waiting: "#D97706",
  inprogress: "#2563EB",
  rejected: "#DC2626",
  approved: "#16A34A",
  accepted: "#15803D",
};

const TOOLTIP_STYLE = {
  fontSize: 12,
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
};

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

  const progressPct = Math.round((kpi.realisasi / ANNUAL_TARGET) * 100) || 0;

  // KPI Cards dengan warna baru (Indigo theme)
  const kpiCards: {
    label: string;
    value: number;
    sub: string;
    icon: any;
    color: string;
    bg: string;
    progress?: number;
  }[] = [
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
      sub: `${progressPct}% dari target`,
      icon: CheckCircle,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      progress: progressPct,
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

  // Semua status ditampilkan (termasuk yang jumlahnya 0) supaya bentuk chart
  // konsisten dan "peta" alur status tetap lengkap, bukan cuma status yang
  // kebetulan sedang ada datanya.
  const statusDist = useMemo(() => {
    const map: Record<string, number> = {};
    apps.forEach((a) => {
      map[a.status] = (map[a.status] || 0) + 1;
    });
    return STATUS_ORDER.map((status) => ({
      status,
      label: STATUS_SHORT_LABEL[status],
      count: map[status] || 0,
      color: BADGE_HEX[STATUS_BADGE_VARIANT[status]] || "#9CA3AF",
    }));
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
      return { month: label, realisasi: accepted, target: 8, diajukan: submitted };
    });
  }, [apps]);

  const pieData = useMemo(() => {
    const done = kpi.realisasi;
    const remaining = Math.max(ANNUAL_TARGET - done, 0);
    return [
      { name: "Selesai", value: done, color: "#4f46e5" },
      { name: "Backlog", value: remaining, color: "#e5e7eb" },
    ];
  }, [kpi.realisasi]);

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-2">
            <div className="h-6 w-32 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-4 w-64 bg-gray-100 rounded-lg animate-pulse" />
          </div>
          <div className="h-9 w-40 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <SkeletonKPICards />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          <SkeletonChartCard height={220} />
          <SkeletonChartCard height={220} />
        </div>
        <SkeletonChartCard height={260} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Selamat pagi, {currentUser.name}. Berikut ringkasan handover
            aplikasi hari ini.
          </p>
        </div>
        {currentUser.role === "Project Manager" && (
          <Button
            onClick={() => onNavigate("handover-form")}
            className="w-full sm:w-auto justify-center"
          >
            + Ajukan Handover Baru
          </Button>
        )}
      </div>

      {/* KPI Cards — 2 kolom di HP, naik bertahap supaya tidak "meloncat"
          dari 2 langsung ke 5 begitu masuk layar desktop besar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {kpiCards.map((k) => (
          <Card key={k.label} className="flex items-start gap-3">
            <div
              className={`w-9 h-9 rounded-lg ${k.bg} flex items-center justify-center flex-shrink-0`}
            >
              <k.icon size={17} className={k.color} />
            </div>
            <div className="min-w-0 flex-1">
              <div className={`text-2xl font-bold font-mono ${k.color}`}>
                {k.value}
              </div>
              <div className="text-xs font-medium text-gray-700 mt-0.5">
                {k.label}
              </div>
              <div className="text-xs text-gray-400">{k.sub}</div>
              {k.progress !== undefined && (
                <div className="mt-1.5 h-1 rounded-full bg-emerald-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, k.progress)}%` }}
                  />
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Snapshot saat ini: progress terhadap target + distribusi status.
          Ditaruh berdampingan (2 kolom mulai md) karena keduanya menjawab
          pertanyaan yang sama: "posisi kita sekarang di mana". */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {/* Donut progress */}
        <Card className="flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900">
              Progress Handover
            </h3>
            <p className="text-xs text-gray-400">
              Realisasi vs target {new Date().getFullYear()}
            </p>
          </div>
          <div className="flex-1 flex flex-col sm:flex-row items-center gap-6">
            <div className="relative w-[140px] h-[140px] flex-shrink-0">
              <PieChart width={140} height={140}>
                <Pie
                  data={pieData}
                  dataKey="value"
                  innerRadius={44}
                  outerRadius={64}
                  startAngle={90}
                  endAngle={-270}
                  paddingAngle={pieData[0].value > 0 && pieData[1].value > 0 ? 2 : 0}
                  stroke="none"
                >
                  {pieData.map((e, i) => (
                    <Cell key={i} fill={e.color} />
                  ))}
                </Pie>
              </PieChart>
              {/* Persentase di tengah donut, supaya angka utamanya langsung
                  kebaca tanpa harus mencocokkan warna ke legenda */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-bold text-indigo-600 font-mono">
                  {progressPct}%
                </span>
                <span className="text-[10px] text-gray-400">Progress</span>
              </div>
            </div>
            <div className="space-y-2.5 w-full sm:w-auto">
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
                  {kpi.realisasi} dari {ANNUAL_TARGET} target tahun ini
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Distribusi status — bar horizontal, tiap status warnanya sama
            dengan Badge yang dipakai di halaman lain (bukan lagi divertikal
            dengan label dirotasi -15° yang susah dibaca, apalagi untuk label
            panjang seperti "Waiting for O&M Review"). */}
        <Card>
          <div className="mb-2">
            <h3 className="text-sm font-semibold text-gray-900">
              Aplikasi per Status
            </h3>
            <p className="text-xs text-gray-400">Distribusi status saat ini</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={statusDist}
              layout="vertical"
              margin={{ top: 4, right: 24, bottom: 4, left: 0 }}
              barCategoryGap="22%"
            >
              <CartesianGrid horizontal={false} stroke="#f1f5f9" />
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={92}
                tick={{ fontSize: 10.5, fill: "#4b5563" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                cursor={{ fill: "#f8fafc" }}
                labelFormatter={(_, payload) =>
                  payload?.[0]?.payload?.status ?? ""
                }
                formatter={(value: number) => [`${value} aplikasi`, "Jumlah"]}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={18}>
                {statusDist.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
                <LabelList
                  dataKey="count"
                  position="right"
                  style={{ fontSize: 10.5, fill: "#374151", fontWeight: 600 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Tren bulanan — full width supaya 12 bulan tidak berdesakan seperti
          sebelumnya (dulu cuma 1/3 lebar & tinggi 130px). Sekarang juga
          menampilkan "Diajukan" (data submittedDate yang sebelumnya dihitung
          tapi tidak pernah ditampilkan) di samping Realisasi vs Target,
          supaya kelihatan gap antara pengajuan dan penyelesaian handover. */}
      <Card>
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Tren Handover Bulanan
            </h3>
            <p className="text-xs text-gray-400">
              Diajukan vs realisasi vs target per bulan
            </p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart
            data={monthlyData}
            margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
          >
            <defs>
              <linearGradient id="dashRealisasiFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              width={28}
              allowDecimals={false}
            />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, color: "#6b7280" }}
            />
            <Bar
              dataKey="diajukan"
              name="Diajukan"
              fill="#c7d2fe"
              radius={[3, 3, 0, 0]}
              barSize={14}
            />
            <Area
              type="monotone"
              dataKey="realisasi"
              name="Realisasi"
              stroke="#4f46e5"
              strokeWidth={2}
              fill="url(#dashRealisasiFill)"
              dot={{ r: 3, fill: "#4f46e5", strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="target"
              name="Target/bulan"
              stroke="#9ca3af"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Attention cards — ala ITSM "Needs Attention": kartu + countdown live, bukan tabel statis */}
        <div className="lg:col-span-2">
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
                className="text-xs text-indigo-600 hover:underline flex items-center gap-1 flex-shrink-0"
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
                              (STATUS_BADGE_VARIANT[app.status] ??
                                "default") as any
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
            <button
              onClick={() => onNavigate("action-items")}
              className="text-xs text-indigo-600 hover:underline"
            >
              Semua
            </button>
          </div>
          <div className="space-y-3 overflow-y-auto flex-1 max-h-72 lg:max-h-none">
            {activity.map((a, i) => (
              <button
                key={i}
                onClick={() => onNavigate("app-detail", a.appId)}
                className="flex gap-3 text-xs text-left w-full hover:bg-gray-50 -mx-1 px-1 py-1 rounded-md"
              >
                <span className="text-base leading-none mt-0.5 flex-shrink-0">
                  {activityIcon(a.action)}
                </span>
                <div className="min-w-0">
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