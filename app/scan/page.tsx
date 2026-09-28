"use client";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { extractFromImage } from "@/lib/ocr";
import { motion, AnimatePresence } from "framer-motion";

type Step = "camera"|"review"|"saving"|"done";

const FIELDS = [
  { key:"name",     label:"اسم الموكل",    placeholder:"الاسم بالكامل",           req:true  },
  { key:"number",   label:"رقم التوكيل",   placeholder:"12345",                   req:true  },
  { key:"letter",   label:"الحرف",          placeholder:"أ / ب ...",               req:false },
  { key:"year",     label:"السنة",          placeholder:"2026",                    req:true  },
  { key:"office",   label:"مكتب التوثيق",  placeholder:"اسم المكتب",              req:false },
  { key:"location", label:"مكان التوكيل",  placeholder:"الدرج الثالث / الرف ...", req:false },
];

export default function ScanPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream|null>(null);
  const [step, setStep]       = useState<Step>("camera");
  const [img, setImg]         = useState<string|null>(null);
  const [ocrP, setOcrP]       = useState(0);
  const [camErr, setCamErr]   = useState("");
  const [facing, setFacing]   = useState<"environment"|"user">("environment");
  const [form, setForm]       = useState({name:"",number:"",letter:"",year:new Date().getFullYear().toString(),office:"",location:""});

  useEffect(() => { if (!loading && !user) router.push("/login"); }, [user, loading]);
  useEffect(() => { startCamera(); return () => stopCamera(); }, [facing]);

  async function startCamera() {
    stopCamera(); setCamErr("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:facing, width:{ideal:1920}, height:{ideal:1080} }, audio:false });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
    } catch { setCamErr("تعذّر الوصول للكاميرا — تأكد من إذن الكاميرا في المتصفح"); }
  }
  function stopCamera() { streamRef.current?.getTracks().forEach(t=>t.stop()); streamRef.current=null; }

  function capture() {
    if (!videoRef.current || !canvasRef.current) return;
    const v=videoRef.current, c=canvasRef.current;
    c.width=v.videoWidth; c.height=v.videoHeight;
    c.getContext("2d")?.drawImage(v,0,0);
    const i=c.toDataURL("image/jpeg",.92);
    setImg(i); stopCamera(); runOCR(i);
  }

  async function runOCR(i: string) {
    setStep("review"); setOcrP(0);
    try { const d=await extractFromImage(i, setOcrP); setForm(p=>({...p,...d})); } catch {}
    setOcrP(100);
  }

  function retake() {
    setImg(null); setStep("camera"); setOcrP(0);
    setForm({name:"",number:"",letter:"",year:new Date().getFullYear().toString(),office:"",location:""});
    startCamera();
  }

  async function handleSave() {
    if (!form.name.trim()) { alert("يرجى كتابة اسم الموكل"); return; }
    setStep("saving");
    try {
      const response = await fetch(img!);
      const blob = await response.blob();
      const {uploadScanImage,addAttorney}=await import("@/lib/firestore");
      const {url,fileName}=await uploadScanImage(blob, form.name.trim());
      await addAttorney({...form, imageUrl:url, fileName});
      setStep("done");
    } catch { alert("حدث خطأ، حاول مرة أخرى"); setStep("review"); }
  }

  if (loading || !user) return null;

  return (
    <div className="page">
      <Navbar />
      <div className="container" style={{maxWidth:"600px"}}>
        <AnimatePresence mode="wait">

          {/* CAMERA */}
          {step==="camera" && (
            <motion.div key="cam" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
              <div className="card">
                <div className="card-header">
                  <h2>📷 سكان التوكيل</h2>
                  <button className="btn btn-ghost" style={{fontSize:"12px",padding:"8px 14px"}}
                    onClick={()=>setFacing(f=>f==="environment"?"user":"environment")}>
                    🔄 تبديل الكاميرا
                  </button>
                </div>
                {camErr ? (
                  <div style={{padding:"40px 20px",textAlign:"center"}}>
                    <div style={{fontSize:"48px",marginBottom:"12px"}}>📵</div>
                    <p style={{fontWeight:700,fontSize:"13px",color:"#dc2626",marginBottom:"16px"}}>{camErr}</p>
                    <button className="btn btn-gold" onClick={startCamera}>إعادة المحاولة</button>
                  </div>
                ) : (
                  <div style={{position:"relative",background:"#000",aspectRatio:"4/3",overflow:"hidden"}}>
                    <video ref={videoRef} style={{width:"100%",height:"100%",objectFit:"cover"}} playsInline muted />
                    {/* إطار */}
                    <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}>
                      <div style={{width:"88%",height:"72%",border:"2px solid #c9a227",borderRadius:"16px",opacity:.8}} />
                    </div>
                    <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"12px",textAlign:"center",background:"linear-gradient(transparent,rgba(0,0,0,.5))"}}>
                      <p style={{color:"rgba(255,255,255,.8)",fontSize:"12px"}}>وجّه الكاميرا على التوكيل بالكامل</p>
                    </div>
                  </div>
                )}
                <canvas ref={canvasRef} style={{display:"none"}} />
                <div style={{padding:"16px"}}>
                  <button className="btn btn-gold btn-full btn-lg" onClick={capture} disabled={!!camErr}>
                    📸 التقاط الصورة
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* REVIEW */}
          {step==="review" && (
            <motion.div key="rev" initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} exit={{opacity:0}}
              style={{display:"flex",flexDirection:"column",gap:"16px"}}>
              {img && (
                <div className="card">
                  <div className="card-header">
                    <span style={{fontSize:"14px",fontWeight:700}}>📄 الصورة الملتقطة</span>
                    <button className="btn btn-ghost" style={{fontSize:"12px",padding:"7px 14px"}} onClick={retake}>🔄 إعادة</button>
                  </div>
                  <img src={img} alt="scan" style={{width:"100%",maxHeight:"220px",objectFit:"contain",background:"#f9fafb"}} />
                </div>
              )}
              {ocrP<100 && (
                <div className="card card-p">
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
                    <span style={{fontSize:"13px",fontWeight:700}}>⚙️ جاري استخراج البيانات...</span>
                    <span style={{fontSize:"13px",fontWeight:900,color:"var(--gold)"}}>{ocrP}%</span>
                  </div>
                  <div className="progress-track">
                    <motion.div className="progress-fill" animate={{width:`${ocrP}%`}} transition={{ease:"linear"}} />
                  </div>
                </div>
              )}
              <div className="card card-p">
                <h3 style={{fontSize:"15px",fontWeight:900,marginBottom:"16px",paddingBottom:"12px",borderBottom:"1px solid var(--border)"}}>
                  ✏️ راجع البيانات وعدّل إذا لزم
                </h3>
                <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
                  {FIELDS.map(f=>(
                    <div key={f.key}>
                      <label className="label">{f.label}{f.req&&<span style={{color:"#ef4444"}}> *</span>}</label>
                      <input value={form[f.key as keyof typeof form]}
                        onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))}
                        placeholder={f.placeholder} className="inp" />
                    </div>
                  ))}
                </div>
                {form.name && (
                  <div className="alert alert-success" style={{marginTop:"12px",display:"flex",alignItems:"center",gap:"8px"}}>
                    📎 اسم الملف: <strong>{form.name.trim()}.jpg</strong>
                  </div>
                )}
                <div style={{display:"flex",gap:"12px",marginTop:"20px"}}>
                  <button className="btn btn-ghost" style={{flex:1}} onClick={retake}>↩️ إعادة التصوير</button>
                  <button className="btn btn-gold" style={{flex:1}} onClick={handleSave} disabled={!form.name.trim()}>
                    💾 حفظ التوكيل
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* SAVING */}
          {step==="saving" && (
            <motion.div key="sav" initial={{opacity:0}} animate={{opacity:1}}
              style={{textAlign:"center",padding:"80px 20px"}}>
              <div style={{width:"72px",height:"72px",borderRadius:"20px",background:"linear-gradient(135deg,#c9a227,#a8841a)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"32px",margin:"0 auto 16px",boxShadow:"0 8px 24px rgba(201,162,39,.4)"}}>
                ⏳
              </div>
              <p style={{fontSize:"18px",fontWeight:900,marginBottom:"6px"}}>جاري الحفظ...</p>
              <p style={{fontSize:"13px",color:"var(--muted)"}}>يتم رفع الصورة وحفظ البيانات</p>
            </motion.div>
          )}

          {/* DONE */}
          {step==="done" && (
            <motion.div key="done" initial={{opacity:0,scale:.92}} animate={{opacity:1,scale:1}}
              style={{textAlign:"center",padding:"60px 20px"}}>
              <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:"spring",stiffness:300,delay:.1}}
                style={{width:"80px",height:"80px",borderRadius:"22px",background:"linear-gradient(135deg,#22c55e,#16a34a)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"40px",margin:"0 auto 20px",boxShadow:"0 8px 28px rgba(34,197,94,.35)"}}>
                ✅
              </motion.div>
              <h2 style={{fontSize:"20px",fontWeight:900,marginBottom:"8px"}}>تم الحفظ بنجاح!</h2>
              <p style={{fontSize:"13px",color:"var(--muted)",marginBottom:"6px"}}>تم حفظ التوكيل والصورة الضوئية في الأرشيف</p>
              {form.name && (
                <span className="badge badge-green" style={{marginBottom:"20px",display:"inline-flex"}}>
                  📎 {form.name.trim()}.jpg
                </span>
              )}
              <div style={{display:"flex",gap:"12px",justifyContent:"center",marginTop:"16px"}}>
                <button className="btn btn-gold" onClick={()=>{setStep("camera");setImg(null);setOcrP(0);setForm({name:"",number:"",letter:"",year:new Date().getFullYear().toString(),office:"",location:""});startCamera();}}>
                  📷 سكان جديد
                </button>
                <button className="btn btn-ghost" onClick={()=>router.push("/search")}>🔍 البحث</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
