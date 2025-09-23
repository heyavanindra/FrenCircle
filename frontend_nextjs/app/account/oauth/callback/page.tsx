"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, Chrome, Home } from "lucide-react";
import { toast } from "sonner";
import { useApi } from "@/hooks/useApi";
import { GoogleCallbackResponse } from "@/hooks/types";
import { useUser } from "@/contexts/UserContext";
import Link from "next/link";

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

type CallbackState = "loading" | "success" | "error";

export default function OAuthCallbackPage() {
  const [state, setState] = useState<CallbackState>("loading");
  const [error, setError] = useState<string>("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { get, setToken } = useApi();
  const { setUser } = useUser();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const errorParam = searchParams.get("error");

        // Check for OAuth errors
        if (errorParam) {
          throw new Error(`OAuth error: ${errorParam}`);
        }

        if (!code || !state) {
          throw new Error("Missing OAuth parameters");
        }

        // Call backend callback endpoint
        const response = await get<GoogleCallbackResponse>(`/auth/google/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`);

        if (response.data?.accessToken && response.data?.user) {
          const data = response.data;
          
          // Set access token in localStorage
          setToken(data.accessToken);
          
          // Update user context with user data
          setUser({
            id: data.user.id,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            username: data.user.username,
            email: data.user.email,
            avatarUrl: data.user.avatarUrl || undefined,
            login: true,
            expiry: new Date(data.expiresAt),
            role: data.user.roles[0] || 'user'
          });

          setState("success");
          toast.success("Successfully logged in with Google!");

          // Redirect after a short delay
          setTimeout(() => {
            const redirectUrl = localStorage.getItem("oauthRedirect") || "/";
            localStorage.removeItem("oauthRedirect");
            router.push(redirectUrl);
          }, 2000);

        } else {
          throw new Error("Invalid response from server");
        }

      } catch (error: any) {
        console.error("OAuth callback error:", error);
        setState("error");
        
        let errorMessage = "Authentication failed";
        if (error?.status && error?.data?.title) {
          errorMessage = error.data.title;
        } else if (error?.message) {
          errorMessage = error.message;
        }
        
        setError(errorMessage);
        toast.error(errorMessage);
      }
    };

    handleCallback();
  }, [searchParams, get, setToken, setUser, router]);

  const renderContent = () => {
    switch (state) {
      case "loading":
        return (
          <motion.div variants={itemVariants} className="text-center space-y-4">
            <div className="mx-auto">
              <Badge variant="secondary" className="px-3 py-1">
                <Chrome className="h-4 w-4 mr-2" />
                Google OAuth
              </Badge>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span>Completing authentication...</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Please wait while we process your Google login
            </p>
          </motion.div>
        );

      case "success":
        return (
          <motion.div variants={itemVariants} className="text-center space-y-4">
            <div className="mx-auto">
              <Badge variant="default" className="px-3 py-1 bg-green-600">
                <CheckCircle className="h-4 w-4 mr-2" />
                Success
              </Badge>
            </div>
            <div className="text-green-600">
              <CheckCircle className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Authentication Successful!</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              You have been successfully logged in with Google. Redirecting...
            </p>
          </motion.div>
        );

      case "error":
        return (
          <motion.div variants={itemVariants} className="text-center space-y-4">
            <div className="mx-auto">
              <Badge variant="destructive" className="px-3 py-1">
                <XCircle className="h-4 w-4 mr-2" />
                Error
              </Badge>
            </div>
            <div className="text-destructive">
              <XCircle className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Authentication Failed</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {error || "An error occurred during authentication"}
            </p>
            <div className="flex justify-center space-x-3">
              <Button
                variant="outline"
                onClick={() => router.push("/account/login")}
              >
                Try Again
              </Button>
              <Button asChild>
                <Link href="/">
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Link>
              </Button>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <motion.div
        className="w-full max-w-md"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">OAuth Authentication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {renderContent()}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}