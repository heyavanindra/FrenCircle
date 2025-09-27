"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import AccessDenied from "@/components/AccessDenied";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Globe } from "lucide-react";
import { useUser } from "@/contexts/UserContext";

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

export default function LinksPage() {
  const { user, isAuthenticated } = useUser();

  if (!isAuthenticated || !user) {
      return <AccessDenied />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
          <div>
            <Link href="/account/profile" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Profile
            </Link>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <Globe className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Links</h1>
            </div>
            <p className="text-muted-foreground">Manage and share your public links</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="h-5 w-5 mr-2" />
                Your Links
              </CardTitle>
              <CardDescription>All your links</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-12 text-center text-muted-foreground">
                <p className="text-lg font-semibold mb-2">All your links</p>
                <p className="text-sm">You haven't added any links yet. Use the button below to create your first link.</p>
                <div className="mt-6">
                  <Button variant="outline">Create Link</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
