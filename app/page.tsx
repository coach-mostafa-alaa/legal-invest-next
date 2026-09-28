"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function Root() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      router.replace(user ? "/dashboard" : "/login");
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1a2a]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#c9a227] to-[#a8841a] flex items-center justify-center text-3xl animate-float shadow-lg">
          ⚖️
        </div>
        <div className="w-8 h-1 bg-[#c9a227] rounded-full animate-pulse" />
      </div>
    </div>
  );
}
