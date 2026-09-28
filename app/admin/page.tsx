"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import {
  getAllAttorneys, getAttorneysByYear, deleteAttorney,
  getActivityLogs, Attorney, ActivityLog,
} from "@/lib/firestore";
import { motion, AnimatePresence } from "framer-motion";

type Tab = "attorneys" | "report" | "logs";

// ── توليد PDF / طباعة الجدول ──
function printReport(year: string, data: Attorney[]) {
  const win = window.open("", "_blank");
  if (!win) return;
  const rows = data.map((a, i) => `
    <tr>
      <td>${a.seqNumber ?? i + 1}</td>
      <td>${a.name}</td>
      <td>${a.number}</td>
      <td>${a.letter || "—"}</td>
      <td>${a.office || "—"}</td>
      <td>${a.location || "—"}</td>
      <td>${(a.imageUrl || a.filePath) ? "✅" : "—"}</td>
    </tr>`).join("");

  win.document.write(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>كشف توكيلات ${year}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'Cairo',sans-serif; direction:rtl; background:#fff; color:#111; padding:24px; }
  .header { text-align:center; margin-bottom:28px; border-bottom:3px solid #c9a227; padding-bottom:20px; }
  .logo { font-size:48px; margin-bottom:8px; }
  .company { font-size:22px; font-weight:900; color:#111; }
  .sub { font-size:14px; color:#555; margin-top:4px; }
  .founder { font-size:12px; color:#888; margin-top:2px; }
  .title { font-size:16px; font-weight:900; margin:20px 0 12px;
    background:linear-gradient(135deg,#c9a227,#a8841a); color:#fff;
    padding:8px 16px; border-radius:8px; display:inline-block; }
  table { width:100%; border-collapse:collapse; font-size:12px; }
  th { background:#0b1523; color:#e8d47a; padding:10px 8px; font-weight:900; text-align:right; }
  td { padding:9px 8px; border-bottom:1px solid #e5e7eb; }
  tr:nth-child(even) td { background:#f9fafb; }
  .count { font-size:12px; color:#888; margin-bottom:8px; }
  .footer { margin-top:24px; text-align:center; font-size:11px; color:#aaa; border-top:1px solid #e5e7eb; padding-top:12px; }
  @media print { .no-print { display:none } }
</style>
</head>
<body>
<div class="header">
  <div class="logo">⚖️</div>
  <div class="company">Legal Invest</div>
  <div class="sub">نظام إدارة وأرشفة التوكيلات القانونية</div>
  <div class="founder">المؤسس: علاء برسي</div>
</div>
<div class="title">📋 كشف توكيلات سنة ${year}</div>
<p class="count">${data.length} توكيل — مرتبة تسلسلياً</p>
<table>
  <thead>
    <tr>
      <th>م</th><th>اسم الموكل</th><th>رقم التوكيل</th><th>الحرف</th>
      <th>مكتب التوثيق</th><th>مكان التوكيل</th><th>ملف</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>
<div class="footer">
  Legal Invest — المؤسس: علاء برسي — طُبع بتاريخ ${new Date().toLocaleDateString("ar-EG")}
</div>
<script>window.onload=()=>{ window.print(); }<\/script>
</body></html>`);
  win.document.close();
}

export default function AdminPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab]           = useState<Tab>("attorneys");
  const [attorneys, setAttorneys] = useState<Attorney[]>([]);
  const [logs, setLogs]         = useState<ActivityLog[]>([]);
  const [busy, setBusy]         = useState(true);
  const [searchQ, setSearchQ]   = useState("");
  const [reportYear, setReportYear] = useState(new Date().getFullYear().toString());
  const [reportData, setReportData] = useState<Attorney[]>([]);
  const [reportBusy, setReportBusy] = useState(false);

  useEffect(() => { if (!loading && (!user || role !== "admin")) router.push("/dashboard"); }, [user, role, loading]);

  useEffect(() => {
    if (!user || role !== "admin") return;
    Promise.all([getAllAttorneys(), getActivityLogs()]).then(([a, l]) => {
      setAttorneys(a); setLogs(l); setBusy(false);
    });
  }, [user, role]);

  async function handleDelete(id: string, fileName?: string) {
    if (!confirm("هل تريد حذف هذا السجل نهائياً؟")) return;
    await deleteAttorney(id, fileName);
    setAttorneys(p => p.filter(a => a.id !== id));
  }

  async function generateReport() {
    setReportBusy(true);
    const data = await getAttorneysByYear(reportYear);
    setReportData(data);
    setReportBusy(false);
  }

  const years   = [...new Set(attorneys.map(a => a.year))].sort((a, b) => Number(b) - Number(a));
  const filtered = attorneys.filter(a =>
    !searchQ || a.name.includes(searchQ) || a.number.includes(searchQ) || a.year.includes(searchQ)
  );

  if (loading || !user) return null;

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id:"attorneys", label:"التوكيلات", icon:"📋" },
    { id:"report",    label:"الكشوفات",  icon:"📄" },
    { id:"logs",      label:"السجل",     icon:"📊" },
  ];

  return (
    <div className="min-h-dvh pb-24 md:pb-8" style={{ background:"#f4f6fb" }}>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 pt-6 space-y-4">

        {/* ── Header ── */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
          className="rounded-2xl p-5 text-white relative overflow-hidden"
          style={{ background:"linear-gradient(135deg,#0b1523,#1e3048)" }}>
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10 pointer-events-none"
            style={{ background:"radial-gradient(circle,#c9a227,transparent)", transform:"translate(30%,-30%)" }} />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2.5 h-2.5 rounded-full bg-green-400"
                style={{ boxShadow:"0 0 8px rgba(74,222,128,.6)" }} />
              <span className="text-[10px] font-black tracking-[4px] uppercase" style={{ color:"#c9a227" }}>ADMIN</span>
            </div>
            <h1 className="text-xl font-black mb-3">لوحة التحكم</h1>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon:"📋", num:attorneys.length,  label:"توكيل" },
                { icon:"📅", num:years.length,       label:"سنة"   },
                { icon:"📎", num:attorneys.filter(a=>a.imageUrl||a.filePath).length, label:"بملف" },
              ].map((s,i) => (
                <div key={i} className="rounded-xl p-3 text-center"
                  style={{ background:"rgba(255,255,255,.08)" }}>
                  <div className="text-xl">{s.icon}</div>
                  <div className="text-xl font-black">{busy ? "..." : s.num}</div>
                  <div className="text-[10px] opacity-60 font-semibold">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Tabs ── */}
        <div className="card p-1.5 flex gap-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all"
              style={{
                background: tab===t.id ? "linear-gradient(135deg,#c9a227,#a8841a)" : "transparent",
                color: tab===t.id ? "#fff" : "#6b7280",
              }}>
              <span>{t.icon}</span><span>{t.label}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ════ ATTORNEYS ════ */}
          {tab === "attorneys" && (
            <motion.div key="atty" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              className="space-y-3">
              <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
                placeholder="🔍 ابحث في التوكيلات..." className="inp" />

              {busy
                ? [...Array(5)].map((_,i) => <div key={i} className="skeleton h-16 w-full rounded-xl" />)
                : filtered.length === 0
                  ? <div className="text-center py-12 font-medium" style={{ color:"#6b7280" }}>لا توجد نتائج</div>
                  : filtered.map((a, i) => (
                    <motion.div key={a.id}
                      initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                      transition={{ delay:i*.025 }}
                      className="card p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow"
                        style={{ background:"linear-gradient(135deg,#c9a227,#a8841a)" }}>
                        {a.seqNumber ?? "#"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-black text-sm truncate" style={{ color:"#111827" }}>{a.name}</div>
                        <div className="text-xs font-medium" style={{ color:"#9ca3af" }}>
                          رقم {a.number} · {a.year} · {a.office || "—"}
                        </div>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        {(a.imageUrl || a.filePath) && (
                          <a href={a.imageUrl || a.filePath} target="_blank"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors"
                            style={{ background:"#dbeafe", color:"#1d4ed8" }}>👁</a>
                        )}
                        <button onClick={() => handleDelete(a.id!, a.fileName)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors"
                          style={{ background:"#fee2e2", color:"#dc2626" }}>🗑</button>
                      </div>
                    </motion.div>
                  ))
              }
            </motion.div>
          )}

          {/* ════ REPORT ════ */}
          {tab === "report" && (
            <motion.div key="rep" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              className="space-y-4">

              <div className="card p-5">
                <h3 className="font-black mb-4" style={{ color:"#111827" }}>📄 توليد كشف التوكيلات</h3>

                {/* اختيار السنة */}
                <div className="flex gap-3 mb-4">
                  <select value={reportYear} onChange={e => setReportYear(e.target.value)}
                    className="inp flex-1" style={{ cursor:"pointer" }}>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <button onClick={generateReport} disabled={reportBusy}
                    className="btn-gold" style={{ flexShrink:0 }}>
                    {reportBusy ? <span className="spinner" /> : "📋 توليد"}
                  </button>
                </div>

                {/* معاينة وتنزيل */}
                {reportData.length > 0 && (
                  <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="font-black text-sm" style={{ color:"#111827" }}>
                          كشف سنة {reportYear}
                        </span>
                        <span className="text-xs font-medium mr-2" style={{ color:"#6b7280" }}>
                          ({reportData.length} توكيل)
                        </span>
                      </div>
                      <button onClick={() => printReport(reportYear, reportData)}
                        className="btn-gold text-xs" style={{ padding:"8px 16px" }}>
                        🖨️ طباعة / تنزيل PDF
                      </button>
                    </div>

                    {/* جدول المعاينة */}
                    <div className="overflow-x-auto rounded-xl border" style={{ borderColor:"#e5e7eb" }}>
                      <table className="w-full text-xs">
                        <thead style={{ background:"#0b1523" }}>
                          <tr>
                            {["م","اسم الموكل","رقم التوكيل","الحرف","المكتب","المكان","ملف"].map(h => (
                              <th key={h} className="px-3 py-2.5 text-right font-black"
                                style={{ color:"#e8d47a" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y" style={{ borderColor:"#f3f4f6" }}>
                          {reportData.map((a, i) => (
                            <tr key={a.id} className="hover:bg-[#f9fafb] transition-colors">
                              <td className="px-3 py-2.5 font-black" style={{ color:"#c9a227" }}>
                                {a.seqNumber ?? i+1}
                              </td>
                              <td className="px-3 py-2.5 font-bold" style={{ color:"#111827" }}>{a.name}</td>
                              <td className="px-3 py-2.5 font-mono" style={{ color:"#374151" }}>{a.number}</td>
                              <td className="px-3 py-2.5" style={{ color:"#374151" }}>{a.letter || "—"}</td>
                              <td className="px-3 py-2.5" style={{ color:"#6b7280" }}>{a.office || "—"}</td>
                              <td className="px-3 py-2.5" style={{ color:"#6b7280" }}>{a.location || "—"}</td>
                              <td className="px-3 py-2.5">
                                {(a.imageUrl || a.filePath)
                                  ? <span className="badge badge-green">✅</span>
                                  : <span style={{ color:"#d1d5db" }}>—</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* ════ LOGS ════ */}
          {tab === "logs" && (
            <motion.div key="logs" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              className="space-y-2">
              {busy
                ? [...Array(5)].map((_,i) => <div key={i} className="skeleton h-14 w-full rounded-xl" />)
                : logs.length === 0
                  ? <div className="text-center py-12 font-medium" style={{ color:"#6b7280" }}>لا توجد سجلات</div>
                  : logs.map((l, i) => (
                    <motion.div key={l.id}
                      initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                      transition={{ delay:i*.03 }}
                      className="card p-3 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm flex-shrink-0"
                        style={{ background:"linear-gradient(135deg,#c9a227,#a8841a)" }}>⚖</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm truncate" style={{ color:"#111827" }}>{l.userName}</div>
                        <div className="text-xs font-medium" style={{ color:"#6b7280" }}>
                          {l.action}{l.details ? ` — ${l.details}` : ""}
                        </div>
                      </div>
                      <div className="text-[10px] font-medium flex-shrink-0" style={{ color:"#9ca3af" }} dir="ltr">
                        {l.createdAt ? new Date((l.createdAt as any).seconds * 1000).toLocaleString("ar-EG") : ""}
                      </div>
                    </motion.div>
                  ))
              }
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
