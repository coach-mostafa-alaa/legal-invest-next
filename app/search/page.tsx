"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { searchAttorneys, Attorney } from "@/lib/firestore";
import { motion, AnimatePresence } from "framer-motion";

export default function SearchPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [q, setQ]               = useState("");
  const [results, setResults]   = useState<Attorney[]>([]);
  const [busy, setBusy]         = useState(false);
  const [searched, setSearched] = useState(false);
  const [expanded, setExpanded] = useState<string|null>(null);

  useEffect(() => { if (!loading && !user) router.push("/login"); }, [user, loading]);

  const doSearch = useCallback(async (query: string) => {
    if (!query.trim()) { setResults([]); setSearched(false); return; }
    setBusy(true);
    const res = await searchAttorneys(query.trim());
    res.sort((a,b) => Number(b.year)-Number(a.year) || a.name.localeCompare(b.name,"ar"));
    setResults(res); setSearched(true); setBusy(false);
  }, []);

  useEffect(() => { const t = setTimeout(()=>doSearch(q),380); return ()=>clearTimeout(t); }, [q, doSearch]);

  if (loading || !user) return null;

  return (
    <div className="page">
      <Navbar />
      <div className="container" style={{maxWidth:"720px"}}>

        {/* Search box */}
        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} className="card card-p">
          <p style={{fontSize:"11px",fontWeight:700,color:"var(--muted)",marginBottom:"10px",letterSpacing:".05em"}}>
            🔍 البحث في الأرشيف
          </p>
          <div style={{position:"relative"}}>
            <input autoFocus value={q} onChange={e=>setQ(e.target.value)}
              placeholder="ابحث بالاسم، رقم التوكيل، السنة، المكتب..."
              className="inp" style={{paddingLeft:"48px"}} />
            <div style={{position:"absolute",left:"16px",top:"50%",transform:"translateY(-50%)"}}>
              {busy ? <span className="spinner" style={{width:"18px",height:"18px"}} /> : <span style={{opacity:.4,fontSize:"16px"}}>🔍</span>}
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        {searched && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}}
            style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
            <span className="badge badge-gold">{results.length} نتيجة</span>
            {results.length>0 && <>
              <span className="badge badge-blue">{new Set(results.map(r=>r.year)).size} سنة</span>
              <span className="badge badge-green">{results.filter(r=>r.imageUrl||r.filePath).length} لها ملف</span>
            </>}
          </motion.div>
        )}

        {/* Results */}
        <AnimatePresence>
          {results.map((r,i) => {
            const open = expanded === r.id;
            return (
              <motion.div key={r.id} initial={{opacity:0,y:14}} animate={{opacity:1,y:0}}
                exit={{opacity:0}} transition={{delay:i*.04}}
                className="card accent-r" style={{cursor:"pointer"}}
                onClick={() => setExpanded(open ? null : (r.id??null))}>

                <div style={{padding:"16px 20px",display:"flex",alignItems:"flex-start",gap:"12px"}}>
                  <div className="avatar">{r.seqNumber ?? "#"}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:"14px",fontWeight:900,color:"var(--text)",marginBottom:"8px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {r.name}
                    </div>
                    <div className="grid-2" style={{gap:"8px"}}>
                      {[{k:"رقم التوكيل",v:r.number},{k:"السنة",v:r.year},{k:"الحرف",v:r.letter},{k:"المكتب",v:r.office}].map(item=>(
                        <div key={item.k} style={{background:"#f9fafb",borderRadius:"8px",padding:"7px 10px"}}>
                          <div style={{fontSize:"10px",fontWeight:700,color:"#9ca3af"}}>{item.k}</div>
                          <div style={{fontSize:"12px",fontWeight:700,color:"var(--text)"}}>{item.v||"—"}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:"6px",flexShrink:0}}>
                    {(r.imageUrl||r.filePath) && <span className="badge badge-green">📎</span>}
                    <span style={{color:"#9ca3af",fontSize:"11px",transition:"transform .2s",display:"inline-block",transform:open?"rotate(180deg)":"rotate(0)"}}>▼</span>
                  </div>
                </div>

                <AnimatePresence>
                  {open && (
                    <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}}
                      exit={{height:0,opacity:0}} transition={{duration:.2}}
                      style={{overflow:"hidden",borderTop:"1px solid #f3f4f6"}}>
                      <div style={{padding:"16px 20px",display:"flex",flexDirection:"column",gap:"12px"}}>
                        {r.location && (
                          <div className="alert alert-info" style={{display:"flex",alignItems:"center",gap:"8px"}}>
                            <span>📍</span><span>{r.location}</span>
                          </div>
                        )}
                        {r.imageUrl && (
                          <>
                            <img src={r.imageUrl} alt="توكيل" style={{width:"100%",borderRadius:"12px",maxHeight:"220px",objectFit:"contain",background:"#f9fafb",border:"1px solid #e5e7eb"}} onClick={e=>e.stopPropagation()} />
                            <div style={{display:"flex",gap:"10px"}}>
                              <a href={r.imageUrl} target="_blank" onClick={e=>e.stopPropagation()} className="btn btn-ghost" style={{flex:1,fontSize:"12px"}}>👁 عرض</a>
                              <a href={r.imageUrl} download={`توكيل_${r.name}`} onClick={e=>e.stopPropagation()} className="btn btn-gold" style={{flex:1,fontSize:"12px"}}>⬇️ تنزيل</a>
                            </div>
                          </>
                        )}
                        {r.filePath && !r.imageUrl && (
                          <div style={{display:"flex",gap:"10px"}}>
                            <a href={r.filePath} target="_blank" onClick={e=>e.stopPropagation()} className="btn btn-ghost" style={{flex:1,fontSize:"12px"}}>👁 عرض</a>
                            <a href={r.filePath} download={`توكيل_${r.name}`} onClick={e=>e.stopPropagation()} className="btn btn-gold" style={{flex:1,fontSize:"12px"}}>⬇️ تنزيل</a>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {searched && results.length===0 && !busy && (
          <div style={{textAlign:"center",padding:"60px 20px"}}>
            <div style={{fontSize:"56px",opacity:.2,marginBottom:"14px"}}>🔍</div>
            <h3 style={{fontSize:"17px",fontWeight:900,color:"var(--text)",marginBottom:"6px"}}>لا توجد نتائج</h3>
            <p style={{fontSize:"13px",color:"var(--muted)"}}>جرّب كلمات بحث مختلفة</p>
          </div>
        )}
        {!searched && !q && (
          <div style={{textAlign:"center",padding:"60px 20px"}}>
            <div style={{fontSize:"64px",opacity:.1,marginBottom:"14px"}}>⚖️</div>
            <h3 style={{fontSize:"17px",fontWeight:900,color:"var(--text)",marginBottom:"6px"}}>ابدأ البحث</h3>
            <p style={{fontSize:"13px",color:"var(--muted)"}}>اكتب اسم الموكل أو رقم التوكيل</p>
          </div>
        )}
      </div>
    </div>
  );
}
