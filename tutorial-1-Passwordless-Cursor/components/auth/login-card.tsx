"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Scan } from "lucide-react";
import { useKeycloakContext } from '@/components/auth/keycloak-provider';

export function LoginCard() {
  const { login } = useKeycloakContext();

  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <Card className="w-full max-w-md mx-4 shadow-2xl">
      <CardHeader className="space-y-4 text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-gradient-to-br from-primary to-accent p-4 rounded-full">
            <Shield className="h-12 w-12 text-white" />
          </div>
        </div>
        <CardTitle className="text-3xl font-bold text-primary">
          VIA ZTF Security Controls
        </CardTitle>
        <CardDescription className="text-base">
          Secure, passwordless authentication with VIA Wallet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Button
            onClick={handleLogin}
            variant="accent"
            size="lg"
            className="w-full text-lg py-6"
          >
            <Scan className="mr-2 h-5 w-5" />
            Login with VIA Wallet
          </Button>

          <div className="bg-secondary/50 p-4 rounded-lg space-y-2">
            <h4 className="font-semibold text-sm text-primary">How it works:</h4>
            <ol className="text-sm text-muted-foreground space-y-1 pl-4 list-decimal">
              <li>Click the login button above</li>
              <li>Scan the QR code with your VIA Wallet app</li>
              <li>Approve the authentication request</li>
              <li>Access your security controls dashboard</li>
            </ol>
          </div>

          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>
              <strong>Zero Trust Security:</strong> No passwords, no phishing risks. 
              Your credentials are cryptographically verified using quantum-resistant encryption.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

