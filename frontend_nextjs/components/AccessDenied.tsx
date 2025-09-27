"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AccessDenied() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground mb-6">You need to be logged in to view this page.</p>
        <Link href="/account/login">
          <Button>Sign In</Button>
        </Link>
      </div>
    </div>
  );
}
