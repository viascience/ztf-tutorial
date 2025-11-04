"use client";

import { Shield } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { useSession } from "@/hooks/use-session";

export function Header() {
  const { user } = useSession();

  return (
    <header className="bg-gradient-to-r from-primary to-accent shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                VIA ZTF Security Controls
              </h1>
              <p className="text-sm text-white/80">Zero Trust Fabric</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">{user.name || user.email}</p>
                <p className="text-xs text-white/70">{user.email}</p>
              </div>
            )}
            <LogoutButton />
          </div>
        </div>
      </div>
    </header>
  );
}



