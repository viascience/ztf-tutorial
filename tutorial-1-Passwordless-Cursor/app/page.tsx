"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useKeycloakContext } from "@/components/auth/keycloak-provider";
import { LoginCard } from "@/components/auth/login-card";

export default function Home() {
  const { authenticated, loading } = useKeycloakContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && authenticated) {
      // User is authenticated, redirect to dashboard
      router.push("/dashboard");
    }
  }, [authenticated, loading, router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary/95 to-accent/90">
        <div className="text-white">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary/95 to-accent/90">
      <LoginCard />
    </main>
  );
}
