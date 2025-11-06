"use client";

import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertCircle } from "lucide-react";

interface SessionExpiredModalProps {
  open: boolean;
  reason?: string;
}

export function SessionExpiredModal({ open, reason }: SessionExpiredModalProps) {
  const router = useRouter();

  const getMessage = () => {
    switch (reason) {
      case "token_revoked":
        return "Your session has been revoked. This may happen if you logged out from your VIA Wallet or if your credentials were revoked by an administrator.";
      case "token_invalid":
        return "Your session is no longer valid. Please log in again to continue.";
      case "session_expired":
        return "Your session has expired due to inactivity. Please log in again to continue.";
      default:
        return "Your session has expired or was terminated. Please log in again to continue.";
    }
  };

  const handleReturn = () => {
    router.push("/");
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <AlertDialogTitle>Session Expired</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left pt-2">
            {getMessage()}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleReturn}>
            Return to Login
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}



