"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { logout } from "@/lib/auth";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LINKS = [
  { href:"/dashboard", label:"الرئيسية", icon:"🏠" },
  { href:"/search",    label:"البحث",    icon:"🔍" },
  { href:"/scan",      label:"سكان",     icon:"📷" },
  { href:"/admin",     label:"الإدارة",  icon:"⚙️", adminOnly:true },
];

export default function Navbar() {
  const { user, role } = useAuth();
  const pathname = usePathname();
  const router   = useRouter();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  async function handleLogout() { await logout(); router.push("/login"); }

  const links = LINKS.filter(l => !l.adminOnly || role === "admin");

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          {/* Logo */}
          <Link href="/dashboard" className="nav-logo">
            <div className="nav-logo-icon">⚖️</div>
            <div className="nav-logo-text">
              <div className="nav-logo-title">Legal Invest</div>
              <div className="nav-logo-sub">نظام التوكيلات</div>
            </div>
          </Link>

          {/* Desktop Links */}
          <div className="nav-links">
            {links.map(l => (
              <Link key={l.href} href={l.href}
                className={`nav-link ${pathname.startsWith(l.href) ? "active" : ""}`}>
                <span>{l.icon}</span><span>{l.label}</span>
              </Link>
            ))}
          </div>

          {/* Right */}
          <div className="nav-right">
            <div className="nav-user">
              <div className="nav-user-av">⚖</div>
              <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {user.email}
              </span>
            </div>
            <button className="nav-logout" onClick={handleLogout} title="خروج">🚪</button>
            <button className="nav-menu-btn" onClick={() => setOpen(o => !o)}>{open ? "✕":"☰"}</button>
          </div>
        </div>

        {/* Mobile dropdown */}
        <AnimatePresence>
          {open && (
            <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }}
              exit={{ height:0, opacity:0 }} transition={{ duration:.2 }}
              className="nav-mobile-menu">
              {links.map(l => (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                  className={`nav-mobile-link ${pathname.startsWith(l.href) ? "active":""}`}>
                  <span>{l.icon}</span><span>{l.label}</span>
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Bottom Nav */}
      <div className="bottom-nav">
        <div className="bottom-nav-inner">
          {links.map(l => {
            const active = pathname.startsWith(l.href);
            return (
              <Link key={l.href} href={l.href}
                className={`bottom-nav-item ${active ? "active":""}`}>
                <span>{l.icon}</span>
                <span>{l.label}</span>
                {active && <div className="bottom-nav-dot" />}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
