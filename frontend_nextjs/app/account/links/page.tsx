"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import AccessDenied from "@/components/AccessDenied";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Globe } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useGet, usePost, useApi } from '@/hooks/useApi';
import { apiService } from '@/hooks/apiService';
import React, { useState, useEffect } from 'react';
import { GetGroupedLinksResponse, LinkItem, CreateOrEditLinkRequest } from '@/hooks/types';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

export default function LinksPage() {
  const { user, isAuthenticated } = useUser();
  const { get } = useApi();

  // Fetch grouped links
  const { data: groupedData, loading: loadingLinks, error: linksError, refetch: refetchLinks } = useGet<GetGroupedLinksResponse>('/link');

  // Local UI state for creating/editing
  const [isCreating, setIsCreating] = useState(false);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateOrEditLinkRequest>({ name: '', url: '', description: '', groupId: null, sequence: 0, isActive: true });

  useEffect(() => {
    if (linksError) {
      console.warn('Links API error:', linksError);
      toast.error('Could not load links.');
    }
  }, [linksError]);

  useEffect(() => {
    // reset form when toggling create
    if (!isCreating) {
      setForm({ name: '', url: '', description: '', groupId: null, sequence: 0, isActive: true });
      setEditingLinkId(null);
    }
  }, [isCreating]);

  const startEdit = (link: LinkItem) => {
    setEditingLinkId(link.id);
    setForm({ id: link.id, name: link.name, url: link.url, description: link.description || '', groupId: link.groupId, sequence: link.sequence, isActive: link.isActive });
    setIsCreating(false);
  };

  const startCreate = (groupId: string | null = null) => {
    setIsCreating(true);
    setEditingLinkId(null);
    setForm({ name: '', url: '', description: '', groupId, sequence: 0, isActive: true });
  };

  const cancel = () => {
    setIsCreating(false);
    setEditingLinkId(null);
    setForm({ name: '', url: '', description: '', groupId: null, sequence: 0, isActive: true });
  };

  const saveLink = async () => {
    try {
      // Use POST /link for create and POST /link/{id}/edit for edit
      if (editingLinkId) {
        await apiService.post(`/link/${editingLinkId}/edit`, form as any);
        toast.success('Link updated');
      } else {
        await apiService.post('/link', form as any);
        toast.success('Link created');
      }

      await refetchLinks();
      cancel();
    } catch (err: any) {
      console.error('Save link failed', err);
      toast.error(err?.data?.title || err?.message || 'Failed to save link');
    }
  };

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
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  Your Links
                </div>
                <div>
                  <Button onClick={() => startCreate(null)}>Create Link</Button>
                </div>
              </CardTitle>
              <CardDescription>All your links</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingLinks && (
                <div className="py-8 text-center text-muted-foreground">Loading links…</div>
              )}

              {!loadingLinks && !groupedData && (
                <div className="py-12 text-center text-muted-foreground">
                  <p className="text-lg font-semibold mb-2">All your links</p>
                  <p className="text-sm">You haven&apos;t added any links yet. Use the button above to create your first link.</p>
                </div>
              )}

              {!loadingLinks && groupedData && (
                <div className="space-y-6">
                  {groupedData.data.groups.map(group => (
                    <div key={group.id} className="border rounded-md p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-semibold">{group.name}</div>
                          {group.description && <div className="text-sm text-muted-foreground">{group.description}</div>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" onClick={() => startCreate(group.id)}>Add</Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {group.links.map(link => (
                          <div key={link.id} className="flex items-center justify-between bg-background p-2 rounded">
                            <div>
                              <a href={link.url} target="_blank" rel="noreferrer" className="font-medium text-primary">{link.name}</a>
                              {link.description && <div className="text-sm text-muted-foreground">{link.description}</div>}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" onClick={() => startEdit(link)}>Edit</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Ungrouped bucket */}
                  <div className="border rounded-md p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-semibold">{groupedData.data.ungrouped.name}</div>
                        {groupedData.data.ungrouped.description && <div className="text-sm text-muted-foreground">{groupedData.data.ungrouped.description}</div>}
                      </div>
                      <div>
                        <Button size="sm" variant="ghost" onClick={() => startCreate(null)}>Add</Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {groupedData.data.ungrouped.links.map(link => (
                        <div key={link.id} className="flex items-center justify-between bg-background p-2 rounded">
                          <div>
                            <a href={link.url} target="_blank" rel="noreferrer" className="font-medium text-primary">{link.name}</a>
                            {link.description && <div className="text-sm text-muted-foreground">{link.description}</div>}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => startEdit(link)}>Edit</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Inline create/edit form */}
              {(isCreating || editingLinkId) && (
                <div className="mt-6 border-t pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input placeholder="Name" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
                    <Input placeholder="URL" value={form.url} onChange={(e) => setForm(f => ({ ...f, url: e.target.value }))} />
                    <Input placeholder="Sequence" value={String(form.sequence ?? 0)} onChange={(e) => setForm(f => ({ ...f, sequence: Number(e.target.value || 0) }))} />
                  </div>
                  <div className="mt-3">
                    <Input placeholder="Description" value={form.description ?? ''} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button onClick={saveLink}>{editingLinkId ? 'Save' : 'Create'}</Button>
                    <Button variant="ghost" onClick={cancel}>Cancel</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
