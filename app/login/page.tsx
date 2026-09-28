"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth";
import { logActivity } from "@/lib/firestore";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const cred = await login(email, password);
      await logActivity(cred.user.email || email, "تسجيل دخول");
      router.push("/dashboard");
    } catch (err: any) {
      const c = err?.code || "";
      if (c.includes("user-not-found") || c.includes("wrong-password") || c.includes("invalid-credential"))
        setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      else if (c.includes("too-many-requests"))
        setError("تم تجاوز عدد المحاولات، حاول لاحقاً");
      else setError(`حدث خطأ: ${c || "unknown"}`);
    } finally { setLoading(false); }
  }

  return (
    <div style={{
      minHeight:"100dvh", display:"flex", alignItems:"center", justifyContent:"center",
      padding:"20px", position:"relative", overflow:"hidden",
      background:"linear-gradient(135deg, #0b1523 0%, #132030 50%, #0b1523 100%)",
    }}>
      {/* ديكور */}
      <div style={{ position:"absolute", top:"-20%", right:"-10%", width:"500px", height:"500px",
        borderRadius:"50%", background:"radial-gradient(circle, rgba(201,162,39,0.12) 0%, transparent 65%)",
        pointerEvents:"none" }} />
      <div style={{ position:"absolute", bottom:"-20%", left:"-10%", width:"400px", height:"400px",
        borderRadius:"50%", background:"radial-gradient(circle, rgba(30,48,72,0.5) 0%, transparent 65%)",
        pointerEvents:"none" }} />

      <motion.div initial={{opacity:0,y:28,scale:.97}} animate={{opacity:1,y:0,scale:1}}
        transition={{duration:.5,ease:[.22,1,.36,1]}}
        style={{width:"100%",maxWidth:"420px",position:"relative",zIndex:1}}>

        {/* Card */}
        <div style={{
          background:"rgba(255,255,255,.97)", borderRadius:"28px",
          boxShadow:"0 24px 60px rgba(0,0,0,.35), 0 0 0 1px rgba(255,255,255,.12)",
          overflow:"hidden",
        }}>
          {/* شريط ذهبي */}
          <div style={{height:"3px",background:"linear-gradient(90deg,#c9a227,#e8d47a,#c9a227)"}} />

          <div style={{padding:"36px 32px 32px"}}>
            {/* أيقونة */}
            <div style={{display:"flex",justifyContent:"center",marginBottom:"20px"}}>
              <motion.div animate={{y:[0,-7,0]}} transition={{duration:3.5,repeat:Infinity,ease:"easeInOut"}}
                style={{
                  width:"80px",height:"80px",borderRadius:"20px",
                  background:"linear-gradient(135deg,#c9a227,#a8841a)",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:"38px", boxShadow:"0 8px 28px rgba(201,162,39,.4)",
                }}>⚖️</motion.div>
            </div>

            <p style={{textAlign:"center",fontSize:"10px",fontWeight:900,letterSpacing:"4px",
              textTransform:"uppercase",color:"#c9a227",marginBottom:"6px"}}>LEGAL INVEST</p>
            <h1 style={{textAlign:"center",fontSize:"22px",fontWeight:900,color:"#111827",marginBottom:"6px"}}>
              نظام إدارة التوكيلات
            </h1>
            <p style={{textAlign:"center",fontSize:"13px",color:"#6b7280",marginBottom:"28px",fontWeight:500}}>
              سجّل دخولك للوصول إلى الأرشيف القانوني
            </p>

            <form onSubmit={handleSubmit} style={{display:"flex",flexDirection:"column",gap:"16px"}}>
              <div>
                <label className="label">البريد الإلكتروني</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                  placeholder="example@company.com" required className="inp inp-ltr" />
              </div>
              <div>
                <label className="label">كلمة المرور</label>
                <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
                  placeholder="••••••••" required className="inp inp-ltr" />
              </div>

              {error && (
                <motion.div initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} className="alert alert-error">
                  ⚠️ {error}
                </motion.div>
              )}

              <button type="submit" disabled={loading} className="btn btn-gold btn-full btn-lg"
                style={{marginTop:"4px",borderRadius:"14px"}}>
                {loading ? <span className="spinner spinner-white" /> : "🔐 دخول"}
              </button>
            </form>
          </div>
        </div>

        <p style={{textAlign:"center",fontSize:"11px",color:"rgba(255,255,255,.3)",fontWeight:500,marginTop:"20px"}}>
          Legal Invest © {new Date().getFullYear()} — نظام أرشفة التوكيلات القانونية
        </p>
      </motion.div>
    </div>
  );
}
