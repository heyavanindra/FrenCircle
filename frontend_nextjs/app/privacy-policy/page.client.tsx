"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ExternalLink } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { delayChildren: 0.2, staggerChildren: 0.12 } },
};

const itemVariants = {
  hidden: { y: 10, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

export default function PrivacyClient() {
  return (
    <div className="min-h-screen bg-background">
      <motion.section
        className="container mx-auto px-4 py-16"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="space-y-4 max-w-4xl mx-auto" variants={itemVariants}>
          <Badge variant="secondary" className="text-sm px-4 py-2">
            Privacy Policy
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-muted-foreground">Effective Date: [Insert Date]</p>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Privacy Policy — frenCircle.com</CardTitle>
              <CardDescription>How we collect, use, and protect your information.</CardDescription>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>Welcome to frenCircle.com (“we,” “our,” “us”). This Privacy Policy explains how we collect, use, and protect your information when you use our website and related services (“Service”).</p>

              <ul className="list-disc pl-5 space-y-3">
                <li>
                  <span className="font-semibold">Information We Collect:</span>{' '}
                  <span>Account Information (email, phone for OTP, login credentials); Usage Data (pages visited, device info, IP address, cookies); Voluntary Data (links, bios, or content you add to your frenCircle page).</span>
                </li>

                <li>
                  <span className="font-semibold">How We Use Your Information:</span>{' '}
                  <span>Create and manage accounts; send OTPs and updates; communicate feature announcements (opt-out available); improve functionality and prevent abuse.</span>
                </li>

                <li>
                  <span className="font-semibold">Cookies:</span>{' '}
                  <span>We use cookies for login sessions, analytics, and remembering preferences. You can control cookies via your browser settings, though some features may be affected if disabled.</span>
                </li>

                <li>
                  <span className="font-semibold">Data Security:</span>{' '}
                  <span>We use reasonable measures to protect your data, but no online method is 100% secure.</span>
                </li>

                <li>
                  <span className="font-semibold">Data Retention:</span>{' '}
                  <span>We retain data as long as necessary for the Service or as required by law. You can request deletion by contacting us at [insert your email].</span>
                </li>

                <li>
                  <span className="font-semibold">Third-Party Services:</span>{' '}
                  <span>We may use third-party tools (e.g., Google Analytics) which may collect anonymized data and maintain their own policies.</span>
                </li>

                <li>
                  <span className="font-semibold">Children’s Privacy:</span>{' '}
                  <span>Our Service is not directed at children under 13 and we do not knowingly collect data from them.</span>
                </li>

                <li>
                  <span className="font-semibold">Changes to This Policy:</span>{' '}
                  <span>We may update this policy occasionally; updated versions will appear on this page with the revised date.</span>
                </li>

                <li>
                  <span className="font-semibold">Contact Us:</span>{' '}
                  <span>Questions? Email [insert your email].</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <div className="mt-6 text-sm text-muted-foreground">
            <Separator />
            <p className="mt-3">Questions? <a href="mailto:support@frencircle.com" className="underline">support@frencircle.com</a></p>
          </div>
        </motion.div>
      </motion.section>
    </div>
  );
}
