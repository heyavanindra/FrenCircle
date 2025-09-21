"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowRight,
  CheckCircle,
  Users,
  Shield,
  Globe,
  Sparkles,
  TrendingUp,
  MessageCircle,
  Heart
} from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.3,
      staggerChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

const features = [
  {
    icon: <Shield className="h-8 w-8" />,
    title: "Security‑first (demo)",
    description:
      "Built with privacy in mind and sensible defaults. Please avoid uploading sensitive production data to this demo."
  },
  {
    icon: <Users className="h-8 w-8" />,
    title: "Simple link management",
    description: "Create, edit, and reorder links and CTAs without the clutter."
  },
  {
    icon: <TrendingUp className="h-8 w-8" />,
    title: "Basic insights (optional)",
    description: "See click counts to understand engagement. Advanced analytics can be added later."
  },
  {
    icon: <Globe className="h-8 w-8" />,
    title: "Works across devices",
    description: "Responsive layouts for modern browsers and screen sizes."
  },
  {
    icon: <Sparkles className="h-8 w-8" />,
    title: "Customizable",
    description: "Choose layouts, themes, and CTA types to match your brand."
  },
  {
    icon: <MessageCircle className="h-8 w-8" />,
    title: "Docs & email support",
    description: "Short guides to get started, with friendly email support."
  }
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <motion.section
        className="container mx-auto px-4 py-20 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="max-w-4xl mx-auto space-y-8" variants={itemVariants}>
          <Badge variant="secondary" className="text-sm px-4 py-2">
            <Sparkles className="h-4 w-4 mr-2" />
            Demo • Neutral copy • No bold claims
          </Badge>

          <motion.h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground"
            variants={itemVariants}
          >
            FrenCircle
          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto"
            variants={itemVariants}
          >
            Organize every social link and CTA on a single page. Share one link, update in minutes, and keep things simple and secure.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            variants={itemVariants}
          >
            <Button size="lg" className="text-lg px-8 py-4">
              Try the demo
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-4">
              Read docs
            </Button>
          </motion.div>

          <motion.div
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
            variants={itemVariants}
          >
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            Secured data (demo)
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 ml-4" />
            No credit card for demo
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 ml-4" />
            Email support
          </motion.div>

          <motion.p
            className="text-xs text-muted-foreground/80 max-w-2xl mx-auto"
            variants={itemVariants}
          >
            This is a demo experience provided for evaluation only. Features shown are indicative and may change.
          </motion.p>
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        className="container mx-auto px-4 py-20"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <motion.div
          className="text-center mb-16"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.h2
            className="text-4xl md:text-5xl font-bold text-foreground mb-4"
            variants={itemVariants}
          >
            Practical basics
          </motion.h2>
          <motion.p
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
            variants={itemVariants}
          >
            Focused features that cover the essentials. No buzzwords—just what you need to get started.
          </motion.p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05 }}
              className="h-full"
            >
              <Card className="h-full shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <div className="text-primary mb-4">{feature.icon}</div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* <motion.section
        className="container mx-auto px-4 py-20"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <Card className="shadow-2xl bg-primary text-primary-foreground overflow-hidden relative">
          <CardContent className="p-12 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Heart className="h-12 w-12 mx-auto mb-6 text-primary-foreground/80" />
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Start in minutes</h2>
              <p className="text-xl mb-8 text-primary-foreground/90 max-w-2xl mx-auto">
                Enter your email to receive a demo link. We’ll share setup steps and tips—no pressure, no hype.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter your email"
                    className="bg-primary-foreground/20 border-primary-foreground/30 text-primary-foreground placeholder:text-primary-foreground/70"
                  />
                  <Button variant="secondary" size="lg">
                    Get demo link
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-center gap-6 text-sm text-primary-foreground/80">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Email support
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Security‑conscious design
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Clear, simple setup
                </div>
              </div>

              <p className="mt-6 text-xs text-primary-foreground/80 max-w-xl mx-auto">
                By submitting, you agree to receive a one‑time demo email. You can opt into updates later if you choose.
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.section> */}

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-muted-foreground">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          © 2025 FrenCircle. This page is a demo for illustrative purposes only.
        </motion.p>
      </footer>
    </div>
  );
}
