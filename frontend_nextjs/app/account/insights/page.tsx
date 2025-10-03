"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import AccessDenied from "@/components/AccessDenied";
import { 
  ArrowLeft, 
  BarChart3, 
  Users, 
  MessageSquare, 
  Activity,
  TrendingUp,
  Calendar,
  Clock,
  Heart,
  Eye
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useGet } from '@/hooks/useApi';
import { apiService } from '@/hooks/apiService';
import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';

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

export default function InsightsPage() {
  const { user, isAuthenticated } = useUser();

  if (!isAuthenticated || !user) {
    return <AccessDenied />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Back Navigation */}
          <motion.div variants={itemVariants}>
            <Link 
              href="/account/profile"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Profile
            </Link>
          </motion.div>

          {/* Header */}
          <motion.div variants={itemVariants} className="space-y-2">
            <div className="flex items-center space-x-3">
              <BarChart3 className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Account Insights</h1>
            </div>
            <p className="text-muted-foreground">
              Track your activity, engagement, and community presence on FrenCircle
            </p>
          </motion.div>

          {/* Quick Stats Overview */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Activity Overview
                </CardTitle>
                <CardDescription>
                  Your account statistics and activity summary
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-6 rounded-lg border bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                    <MessageSquare className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">0</div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">Posts</div>
                  </div>
                  <div className="text-center p-6 rounded-lg border bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
                    <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-700 dark:text-green-300">0</div>
                    <div className="text-sm text-green-600 dark:text-green-400">Friends</div>
                  </div>
                  <div className="text-center p-6 rounded-lg border bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
                    <Heart className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">0</div>
                    <div className="text-sm text-purple-600 dark:text-purple-400">Likes Received</div>
                  </div>
                  <div className="text-center p-6 rounded-lg border bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
                    <Calendar className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">1</div>
                    <div className="text-sm text-orange-600 dark:text-orange-400">Days Active</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Engagement Metrics */}
          <motion.div variants={itemVariants}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>
                    Your latest interactions and posts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center py-12 text-muted-foreground">
                      <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No recent activity</p>
                      <p className="text-sm">Start engaging with the community!</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Engagement Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Engagement
                  </CardTitle>
                  <CardDescription>
                    How others interact with your content
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center space-x-3">
                        <Eye className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm">Profile Views</span>
                      </div>
                      <Badge variant="secondary">0</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center space-x-3">
                        <Heart className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm">Total Likes</span>
                      </div>
                      <Badge variant="secondary">0</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center space-x-3">
                        <MessageSquare className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm">Comments</span>
                      </div>
                      <Badge variant="secondary">0</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Monthly Summary */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  This Month&apos;s Summary
                </CardTitle>
                <CardDescription>
                  Your activity breakdown for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">0</div>
                    <div className="text-sm text-muted-foreground mb-1">Posts Created</div>
                    <div className="text-xs text-green-600">+0% from last month</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">0</div>
                    <div className="text-sm text-muted-foreground mb-1">New Connections</div>
                    <div className="text-xs text-green-600">+0% from last month</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">1</div>
                    <div className="text-sm text-muted-foreground mb-1">Active Days</div>
                    <div className="text-xs text-green-600">+100% from last month</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Action Items */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>Get More Engaged</CardTitle>
                <CardDescription>
                  Tips to increase your activity and build connections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border bg-muted/50">
                    <h4 className="font-medium mb-2">Complete Your Profile</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Add a bio and profile picture to make a great first impression.
                    </p>
                    <Link href="/account/profile">
                      <Button size="sm" variant="outline">
                        Edit Profile
                      </Button>
                    </Link>
                  </div>
                  <div className="p-4 rounded-lg border bg-muted/50">
                    <h4 className="font-medium mb-2">Share Your First Post</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Start engaging with the community by sharing your thoughts.
                    </p>
                    <Button size="sm" variant="outline" disabled>
                      Create Post (Coming Soon)
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Analytics Overview */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Link Clicks
                </CardTitle>
                <CardDescription>
                  Total clicks across your links and per-link breakdown
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AnalyticsOverview />
                <div className="mt-6">
                  <MonthlyStats />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

function AnalyticsOverview() {
  // GET /analytics/my/links -> [{ linkId, clicks }]
  const { data: countsResp, loading: loadingCounts, error: countsError, refetch: refetchCounts } = useGet<any[]>("/analytics/my/links");

  // GET /link -> to map linkId to name (owner's links)
  const { data: linksResp, loading: loadingLinks, error: linksError, refetch: refetchLinks } = useGet<any>("/link");

  const [rows, setRows] = useState<Array<{ linkId: string; name: string; clicks: number }>>([]);

  useEffect(() => {
    if (!countsResp || !linksResp) return;

    try {
      const counts = (countsResp && (countsResp as any).data) ? (countsResp as any).data : countsResp ?? [];
      const groups = (linksResp && (linksResp as any).data && (linksResp as any).data.groups) ? (linksResp as any).data.groups : (linksResp?.groups ?? []);
      const ungrouped = (linksResp && (linksResp as any).data && (linksResp as any).data.ungrouped) ? (linksResp as any).data.ungrouped : (linksResp?.ungrouped ?? { links: [] });
      const links = ([] as any[]).concat(...(groups.map((g: any) => g.links ?? [])), ungrouped.links ?? []);

      const rowsLocal = (counts as any[]).map((c) => {
        const link = links.find((l: any) => l.id === c.linkId);
        return { linkId: c.linkId, name: link ? link.name : c.linkId, clicks: c.clicks };
      });

      setRows(rowsLocal);
    } catch (err) {
      console.warn('AnalyticsOverview build rows failed', err);
    }
  }, [countsResp, linksResp]);

  const total = useMemo(() => rows.reduce((s, r) => s + (r.clicks || 0), 0), [rows]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold">{loadingCounts ? '...' : total}</div>
          <div className="text-sm text-muted-foreground">Total link clicks</div>
        </div>
        <div>
          <Button size="sm" variant="outline" onClick={() => { refetchCounts(); refetchLinks(); }}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="text-left text-sm text-muted-foreground">
              <th className="px-2 py-2">Link</th>
              <th className="px-2 py-2">Clicks</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.linkId} className="border-t">
                <td className="px-2 py-3">{r.name}</td>
                <td className="px-2 py-3 font-medium">{r.clicks}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={2} className="px-2 py-6 text-center text-sm text-muted-foreground">No analytics yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MonthlyStats() {
  const [from, setFrom] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState<string>(() => new Date().toISOString().slice(0, 10));

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.get(`/analytics/my/summary?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
      setData(res.data?.data ?? res.data ?? null);
    } catch (err: any) {
      console.warn('MonthlyStats fetch failed', err);
      setError(err?.message || 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mt-4 border-t pt-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">From</label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">To</label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div>
          <Button size="sm" onClick={fetchSummary} disabled={loading}>{loading ? 'Loading...' : 'Get'}</Button>
        </div>
      </div>

      {error && <p className="text-sm text-red-500 mt-3">{error}</p>}

      {data && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border text-center">
            <div className="text-sm text-muted-foreground">Total Clicks</div>
            <div className="text-2xl font-bold">{data.totalClicks}</div>
            <div className="text-xs text-muted-foreground">{data.days} days ({new Date(data.from).toLocaleDateString()} - {new Date(data.to).toLocaleDateString()})</div>
          </div>
          <div className="p-4 rounded-lg border text-center">
            <div className="text-sm text-muted-foreground">Avg Clicks / Day</div>
            <div className="text-2xl font-bold">{Number(data.averagePerDay).toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">Average over selected range</div>
          </div>
          <div className="p-4 rounded-lg border text-center">
            <div className="text-sm text-muted-foreground">Links</div>
            <div className="text-2xl font-bold">--</div>
            <div className="text-xs text-muted-foreground">(per-link breakdown above)</div>
          </div>
        </div>
      )}
    </div>
  );
}