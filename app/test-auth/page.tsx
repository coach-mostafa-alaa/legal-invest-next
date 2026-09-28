"use client";
import { useState } from "react";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import app from "@/lib/firebase";

export default function TestAuth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const auth = getAuth(app);

  async function testLogin() {
    setLoading(true);
    setResult("");
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      setResult(`✅ تسجيل دخول ناجح!\nUID: ${cred.user.uid}\nEmail: ${cred.user.email}`);
    } catch (err: any) {
      setResult(`❌ خطأ في الدخول:\nCode: ${err.code}\nMessage: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function testCreate() {
    setLoading(true);
    setResult("");
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      setResult(`✅ تم إنشاء الحساب!\nUID: ${cred.user.uid}\nEmail: ${cred.user.email}`);
    } catch (err: any) {
      setResult(`❌ خطأ في الإنشاء:\nCode: ${err.code}\nMessage: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 32, fontFamily: "monospace", direction: "ltr", maxWidth: 500 }}>
      <h2 style={{ marginBottom: 16 }}>🔥 Firebase Auth Test</h2>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", marginBottom: 4, fontSize: 12 }}>Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ width: "100%", padding: "8px 12px", border: "1px solid #ccc", borderRadius: 8, fontSize: 14 }}
          placeholder="test@example.com"
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 4, fontSize: 12 }}>Password (min 6 chars)</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ width: "100%", padding: "8px 12px", border: "1px solid #ccc", borderRadius: 8, fontSize: 14 }}
          placeholder="••••••"
        />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <button
          onClick={testLogin}
          disabled={loading}
          style={{ flex: 1, padding: "10px", background: "#c9a227", color: "#fff", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer" }}
        >
          {loading ? "..." : "🔐 Test Login"}
        </button>
        <button
          onClick={testCreate}
          disabled={loading}
          style={{ flex: 1, padding: "10px", background: "#1a2332", color: "#fff", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer" }}
        >
          {loading ? "..." : "➕ Create User"}
        </button>
      </div>

      {result && (
        <pre style={{
          background: result.includes("✅") ? "#d4edda" : "#f8d7da",
          border: `1px solid ${result.includes("✅") ? "#b1dfbb" : "#f1b0b7"}`,
          borderRadius: 8,
          padding: 16,
          fontSize: 13,
          whiteSpace: "pre-wrap",
          wordBreak: "break-all"
        }}>
          {result}
        </pre>
      )}

      <div style={{ marginTop: 20, padding: 12, background: "#f8fafc", borderRadius: 8, fontSize: 12, color: "#666" }}>
        <strong>Firebase Config Check:</strong><br />
        Project ID: {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}<br />
        Auth Domain: {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}<br />
        App ID: {process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.slice(0, 20)}...
      </div>
    </div>
  );
}
