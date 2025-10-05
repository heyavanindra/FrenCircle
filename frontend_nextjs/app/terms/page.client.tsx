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

export default function TermsClient() {
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
            Terms & Privacy
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Privacy Policy & Terms</h1>
          <p className="text-muted-foreground">Effective Date: [Insert Date]</p>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Terms & Conditions — frenCircle.com</CardTitle>
              <CardDescription>Rules and responsibilities for using the Service.</CardDescription>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>Effective Date: [Insert Date]</p>
              <p>Welcome to frenCircle.com (“Service,” “we,” “our,” “us”). By accessing or using frenCircle.com, you agree to these Terms.</p>

              <ul className="list-disc pl-5 space-y-3">
                <li>
                  <span className="font-semibold">Use of Service:</span>{' '}
                  <span>You may use frenCircle.com to create and share your personal link page. You must provide accurate information and not use the Service for unlawful or harmful purposes. You are responsible for all content you upload or link to your page.</span>
                </li>

                <li>
                  <span className="font-semibold">Account:</span>{' '}
                  <span>You’re responsible for maintaining your account security. We may suspend or terminate accounts that violate these Terms or misuse the platform.</span>
                </li>

                <li>
                  <span className="font-semibold">User Content:</span>{' '}
                  <span>You own the rights to the content you add. By posting content, you grant us a non-exclusive license to display it publicly as part of your frenCircle page. You agree not to post content that’s illegal, obscene, defamatory, or violates others’ rights.</span>
                </li>

                <li>
                  <span className="font-semibold">Premium Features:</span>{' '}
                  <span>We may offer paid or premium features in the future. Any paid plans will have their own clear pricing and refund policies.</span>
                </li>

                <li>
                  <span className="font-semibold">Intellectual Property:</span>{' '}
                  <span>The design, logo, and software of frenCircle.com belong to us. You may not copy, modify, or distribute them without permission.</span>
                </li>

                <li>
                  <span className="font-semibold">Limitation of Liability:</span>{' '}
                  <span>frenCircle.com is provided “as is.” We are not liable for any damages or data loss resulting from the use of our Service.</span>
                </li>

                <li>
                  <span className="font-semibold">Termination:</span>{' '}
                  <span>We reserve the right to terminate or restrict your access if you violate these Terms.</span>
                </li>

                <li>
                  <span className="font-semibold">Changes to Terms:</span>{' '}
                  <span>We may update these Terms at any time. The latest version will always be available on our site.</span>
                </li>

                <li>
                  <span className="font-semibold">Contact:</span>{' '}
                  <span>For questions, email [insert your contact email].</span>
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
