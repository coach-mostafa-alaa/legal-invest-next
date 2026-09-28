"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { getAllAttorneys, Attorney } from "@/lib/firestore";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [attorneys, setAttorneys] = useState<Attorney[]>([]);
  const [stats, setStats]   = useState({ total:0, years:0, withFile:0 });
  const [busy, setBusy]     = useState(true);

  useEffect(() => { if (!loading && !user) router.push("/login"); }, [user, loading]);
  useEffect(() => {
    if (!user) return;
    getAllAttorneys().then(data => {
      setAttorneys(data);
      setStats({ total:data.length, years:new Set(data.map(a=>a.year)).size, withFile:data.filter(a=>a.filePath||a.imageUrl).length });
      setBusy(false);
    });
  }, [user]);

  if (loading || !user) return null;

  const recent = attorneys.slice(0, 5);
  const ACTIONS = [
    { href:"/search", icon:"🔍", title:"البحث في الأرشيف",  desc:"ابحث بالاسم أو الرقم أو السنة",           bg:"linear-gradient(135deg,#1d4ed8,#1e40af)" },
    { href:"/scan",   icon:"📷", title:"سكان توكيل جديد",   desc:"صوّر التوكيل واستخرج البيانات تلقائياً",  bg:"linear-gradient(135deg,#c9a227,#a8841a)" },
    ...(role==="admin" ? [{ href:"/admin", icon:"⚙️", title:"لوحة التحكم", desc:"إدارة التوكيلات والكشوفات", bg:"linear-gradient(135deg,#0b1523,#1e3048)" }] : []),
  ];

  return (
    <div className="page">
      <Navbar />
      <div className="container">

        {/* Hero */}
        <motion.div initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} className="hero-card">
          <div style={{position:"relative",zIndex:1}}>
            <p style={{fontSize:"10px",fontWeight:900,letterSpacing:"4px",textTransform:"uppercase",color:"#c9a227",marginBottom:"4px"}}>
              LEGAL INVEST
            </p>
            <h1 style={{fontSize:"24px",fontWeight:900,marginBottom:"4px"}}>مرحباً 👋</h1>
            <p style={{fontSize:"13px",opacity:.6}}>{user.email}</p>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid-3">
          {[
            {icon:"📋",num:stats.total,   label:"إجمالي التوكيلات",delay:.06},
            {icon:"📅",num:stats.years,   label:"سنة في الأرشيف",  delay:.12},
            {icon:"📎",num:stats.withFile,label:"لها ملف مرفق",    delay:.18},
          ].map((s,i) => (
            <motion.div key={i} initial={{opacity:0,y:14}} animate={{opacity:1,y:0}}
              transition={{delay:s.delay}} className="stat-card">
              <div style={{fontSize:"22px",marginBottom:"6px"}}>{s.icon}</div>
              {busy
                ? <div className="skeleton" style={{height:"28px",width:"40px",margin:"0 auto 4px"}}/>
                : <div style={{fontSize:"24px",fontWeight:900,color:"var(--text)"}}>{s.num}</div>
              }
              <div style={{fontSize:"10px",fontWeight:600,color:"var(--muted)",marginTop:"3px"}}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Actions */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:"14px"}}>
          {ACTIONS.map((a,i) => (
            <motion.div key={a.href} initial={{opacity:0,y:18}} animate={{opacity:1,y:0}}
              transition={{delay:.22+i*.08}} whileHover={{y:-3}} whileTap={{scale:.98}}>
              <Link href={a.href}>
                <div className="action-card" style={{background:a.bg}}>
                  <div style={{fontSize:"38px"}}>{a.icon}</div>
                  <div>
                    <div style={{fontSize:"15px",fontWeight:900,marginBottom:"3px"}}>{a.title}</div>
                    <div style={{fontSize:"12px",opacity:.7}}>{a.desc}</div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Recent */}
        {recent.length > 0 && (
          <motion.div initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay:.4}} className="card">
            <div className="card-header">
              <h2 className="card-header">📋 آخر التوكيلات</h2>
              <Link href="/search" style={{fontSize:"12px",fontWeight:700,color:"var(--gold)"}}>عرض الكل ←</Link>
            </div>
            <div>
              {recent.map((a,i) => (
                <motion.div key={a.id} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}}
                  transition={{delay:.45+i*.04}}
                  style={{padding:"14px 20px",display:"flex",alignItems:"center",gap:"12px",borderBottom:i<recent.length-1?"1px solid #f3f4f6":"none"}}>
                  <div className="avatar" style={{fontSize:"13px"}}>{a.seqNumber ?? "#"}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:"14px",fontWeight:700,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.name}</div>
                    <div style={{fontSize:"12px",color:"var(--muted)",fontWeight:500}}>رقم {a.number} · {a.year} · {a.office}</div>
                  </div>
                  {(a.filePath||a.imageUrl) && <span className="badge badge-green">📎</span>}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
