"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  closestCenter,
  MeasuringStrategy,
  defaultDropAnimation,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";

import AccessDenied from "@/components/AccessDenied";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

import {
  ArrowLeft, Globe, Plus, GripVertical, ExternalLink, Edit3, Trash2, FolderPlus,
} from "lucide-react";
import { toast } from "sonner";

import { useUser } from "@/contexts/UserContext";
import { useApi, useGet } from "@/hooks/useApi";
import { GetGroupedLinksResponse, LinkItem, CreateOrEditLinkRequest } from "@/hooks/types";

/* ---------- FX presets ---------- */
const containerVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };
const cardVariants = { hidden: { opacity: 0, scale: 0.98 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.25 } } };

/* ---------- Sortable row (single Link chip) ---------- */
function SortableLinkRow({ item, onEdit }: { item: LinkItem; onEdit: (l: LinkItem) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    boxShadow: isDragging ? "0 8px 24px rgba(0,0,0,0.20)" : undefined,
  } as React.CSSProperties;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group/link flex items-center gap-3 rounded-lg border bg-background/60 hover:bg-accent/50 transition-all p-3 cursor-grab active:cursor-grabbing`}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground opacity-60 group-hover/link:opacity-100 transition-opacity" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-sm truncate hover:text-primary transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {item.name}
          </a>
          <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
        </div>
        {item.description && (
          <p className="text-xs text-muted-foreground mt-1 truncate">{item.description}</p>
        )}
      </div>
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 opacity-0 group-hover/link:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          onEdit(item);
        }}
      >
        <Edit3 className="h-4 w-4" />
      </Button>
    </div>
  );
}

/* ---------- Group section (sortable container) ---------- */
function GroupSection({
  id,
  name,
  description,
  items,
  onCreateLink,
  onDeleteGroup,
  onEdit,
  onEmptyDropHint,
}: {
  id: string | null; // null for ungrouped
  name: string;
  description?: string | null;
  items: LinkItem[];
  onCreateLink: (groupId: string | null) => void;
  onDeleteGroup?: (groupId: string) => void;
  onEdit: (l: LinkItem) => void;
  onEmptyDropHint?: string;
}) {
  return (
    <AccordionItem value={id ?? "ungrouped"} className="rounded-xl border bg-card">
      <AccordionTrigger className="px-4">
        <div className="flex items-start justify-between w-full gap-3">
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${id ? "bg-gradient-to-r from-primary to-blue-500" : "bg-muted-foreground"}`} />
              <span className="font-semibold">{name}</span>
            </div>
            {description ? <p className="text-xs text-muted-foreground mt-1">{description}</p> : null}
          </div>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onCreateLink(id); }}>
              <Plus className="h-4 w-4" />
            </Button>
            {id && onDeleteGroup ? (
              <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onDeleteGroup(id); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 min-h-[84px]">
            <AnimatePresence initial={false}>
              {items.map((link) => (
                <motion.div key={link.id} variants={cardVariants} initial="hidden" animate="visible" exit="hidden">
                  <SortableLinkRow item={link} onEdit={onEdit} />
                </motion.div>
              ))}
            </AnimatePresence>

            {items.length === 0 && (
              <div className="flex items-center justify-center h-24 border-2 border-dashed rounded-lg">
                <div className="text-center">
                  <Plus className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{onEmptyDropHint ?? "Drop links here"}</p>
                </div>
              </div>
            )}
          </div>
        </SortableContext>
      </AccordionContent>
    </AccordionItem>
  );
}

/* ---------- Main Page ---------- */
export default function LinksPage() {
  const { user, isAuthenticated } = useUser();
  const { post } = useApi();
  const { data: groupedData, loading: loadingLinks, error: linksError, refetch: refetchLinks } =
    useGet<GetGroupedLinksResponse>("/link");

  // create/edit state
  const [isCreating, setIsCreating] = useState(false);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateOrEditLinkRequest>({
    name: "",
    url: "",
    description: "",
    groupId: null,
    sequence: 0,
    isActive: true,
  });

  // group create modal
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupForm, setGroupForm] = useState<{ name: string; description?: string | null; sequence?: number }>({
    name: "",
    description: "",
    sequence: 0,
  });

  // Local optimistic structure
  const [localGroups, setLocalGroups] = useState<
    { id: string; name: string; description?: string | null; links: LinkItem[] }[]
  >([]);
  const [localUngrouped, setLocalUngrouped] = useState<LinkItem[]>([]);

  // drag state
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeItemRef = useRef<LinkItem | null>(null);

  useEffect(() => {
    if (linksError) {
      console.warn("Links API error:", linksError);
      toast.error("Could not load links.");
    }
  }, [linksError]);

  // hydrate local state from API
  useEffect(() => {
    if (!groupedData?.data) return;
    setLocalGroups(
      groupedData.data.groups.map((g) => ({
        id: g.id,
        name: g.name,
        description: g.description,
        links: [...g.links].sort((a, b) => a.sequence - b.sequence),
      }))
    );
    setLocalUngrouped([...groupedData.data.ungrouped.links].sort((a, b) => a.sequence - b.sequence));
  }, [groupedData]);

  const findItem = (id: string): { from: "group" | "ungrouped"; groupId: string | null; index: number } | null => {
    const unIdx = localUngrouped.findIndex((l) => l.id === id);
    if (unIdx > -1) return { from: "ungrouped", groupId: null, index: unIdx };
    for (const g of localGroups) {
      const idx = g.links.findIndex((l) => l.id === id);
      if (idx > -1) return { from: "group", groupId: g.id, index: idx };
    }
    return null;
  };

  /* ---------- DnD sensors ---------- */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 75, tolerance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const allContainerIds = useMemo(() => {
    return ["__ungrouped__", ...localGroups.map((g) => g.id)];
  }, [localGroups]);

  const getContainerFromLinkId = (id: string) => {
    const meta = findItem(id);
    if (!meta) return null;
    return meta.groupId ?? "__ungrouped__";
  };

  const onDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id);
    setActiveId(id);
    const meta = findItem(id);
    if (!meta) return;
    activeItemRef.current =
      meta.from === "ungrouped" ? localUngrouped[meta.index] : localGroups.find((g) => g.id === meta.groupId)!.links[meta.index];
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);

    // If dropping onto a link, we’ll consider container from that link’s location.
    // If dropping onto an empty container, over.id will be the container id.
    const activeContainer = getContainerFromLinkId(activeIdStr);
    let overContainer = allContainerIds.includes(overIdStr) ? overIdStr : getContainerFromLinkId(overIdStr);

    if (!activeContainer || !overContainer) return;

    // If container changed, move to new group
    if (activeContainer !== overContainer) {
      // remove from old
      let moved: LinkItem | null = null;

      if (activeContainer === "__ungrouped__") {
        setLocalUngrouped((prev) => {
          const idx = prev.findIndex((l) => l.id === activeIdStr);
          if (idx === -1) return prev;
          moved = prev[idx];
          const next = [...prev];
          next.splice(idx, 1);
          return next;
        });
      } else {
        setLocalGroups((prev) => {
          const gi = prev.findIndex((g) => g.id === activeContainer);
          if (gi === -1) return prev;
          const next = [...prev];
          const idx = next[gi].links.findIndex((l) => l.id === activeIdStr);
          if (idx > -1) {
            moved = next[gi].links[idx];
            next[gi].links.splice(idx, 1);
          }
          return next;
        });
      }

      if (!moved) return;

      // insert to new
      if (overContainer === "__ungrouped__") {
        setLocalUngrouped((prev) => [moved!, ...prev]);
      } else {
        setLocalGroups((prev) => {
          const gi = prev.findIndex((g) => g.id === overContainer);
          if (gi === -1) return prev;
          const next = [...prev];
          next[gi].links = [moved!, ...next[gi].links];
          return next;
        });
      }

      // persist (group change)
      try {
        await post(`/link/${activeIdStr}/edit`, {
          ...(activeItemRef.current as LinkItem),
          groupId: overContainer === "__ungrouped__" ? null : overContainer,
        });
        await post("/link/resequence", buildResequencePayload()); // optional bulk resequence endpoint (see below)
        toast.success("Link moved");
      } catch (e: any) {
        toast.error(e?.data?.title || "Failed to move link");
      }
      return;
    }

    // Same container reorder
    if (activeContainer === "__ungrouped__") {
      setLocalUngrouped((prev) => {
        const oldIndex = prev.findIndex((i) => i.id === activeIdStr);
        const newIndex = prev.findIndex((i) => i.id === overIdStr);
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return prev;
        return arrayMove(prev, oldIndex, newIndex);
      });
    } else {
      setLocalGroups((prev) => {
        const gi = prev.findIndex((g) => g.id === activeContainer);
        if (gi === -1) return prev;
        const links = prev[gi].links;
        const oldIndex = links.findIndex((i) => i.id === activeIdStr);
        const newIndex = links.findIndex((i) => i.id === overIdStr);
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return prev;
        const next = [...prev];
        next[gi] = { ...next[gi], links: arrayMove(links, oldIndex, newIndex) };
        return next;
      });
    }

    // persist (sequence change)
    try {
      await post("/link/resequence", buildResequencePayload());
    } catch (e: any) {
      toast.error(e?.data?.title || "Failed to save order");
    }
  };

  // Build a concise resequence payload (OPTIONAL: create this backend route for fewer writes)
  const buildResequencePayload = () => {
    const payload: { id: string; groupId: string | null; sequence: number }[] = [];
    localGroups.forEach((g) => {
      g.links.forEach((l, i) => payload.push({ id: l.id, groupId: g.id, sequence: i }));
    });
    localUngrouped.forEach((l, i) => payload.push({ id: l.id, groupId: null, sequence: i }));
    return payload;
  };

  // create/edit helpers
  const startEdit = (link: LinkItem) => {
    setEditingLinkId(link.id);
    setForm({
      id: link.id,
      name: link.name,
      url: link.url,
      description: link.description || "",
      groupId: link.groupId,
      sequence: link.sequence,
      isActive: link.isActive,
    });
    setIsCreating(false);
  };

  const startCreate = (groupId: string | null = null) => {
    setIsCreating(true);
    setEditingLinkId(null);
    setForm({ name: "", url: "", description: "", groupId, sequence: 0, isActive: true });
  };

  const cancel = () => {
    setIsCreating(false);
    setEditingLinkId(null);
    setForm({ name: "", url: "", description: "", groupId: null, sequence: 0, isActive: true });
  };

  const saveLink = async () => {
    try {
      if (editingLinkId) {
        await post(`/link/${editingLinkId}/edit`, form as any);
        toast.success("Link updated");
      } else {
        await post("/link", form as any);
        toast.success("Link created");
      }
      await refetchLinks();
      cancel();
    } catch (err: any) {
      console.error("Save link failed", err);
      toast.error(err?.data?.title || err?.message || "Failed to save link");
    }
  };

  const createGroup = async () => {
    try {
      await post("/group", groupForm as any);
      toast.success("Group created");
      await refetchLinks();
      setGroupForm({ name: "", description: "", sequence: 0 });
      setIsCreatingGroup(false);
    } catch (err: any) {
      console.error("Create group failed", err);
      toast.error(err?.data?.title || err?.message || "Failed to create group");
    }
  };

  const deleteGroup = async (groupId: string) => {
    if (!confirm("Delete group? Links in the group will be moved to Ungrouped.")) return;
    try {
      await post(`/group/${groupId}/delete`, {});
      toast.success("Group deleted");
      await refetchLinks();
    } catch (err: any) {
      console.error("Delete group failed", err);
      toast.error(err?.data?.title || err?.message || "Failed to delete group");
    }
  };

  if (!isAuthenticated || !user) return <AccessDenied />;

  const dragOverlayItem = activeItemRef.current;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
          <div>
            <Link
              href="/account/profile"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Profile
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Globe className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Links</h1>
              <p className="text-muted-foreground text-sm">Drag to reorder. Drop into any group.</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setIsCreatingGroup(true)}>
                <FolderPlus className="h-4 w-4 mr-2" />
                New Group
              </Button>
              <Button size="sm" onClick={() => startCreate(null)}>
                <Plus className="h-4 w-4 mr-2" />
                New Link
              </Button>
            </div>
          </div>

          {loadingLinks ? (
            <motion.div variants={cardVariants} className="py-16 text-center">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading your links...</p>
            </motion.div>
          ) : !groupedData ? (
            <motion.div variants={cardVariants} className="py-16 text-center">
              <div className="h-16 w-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-6">
                <Globe className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No links yet</h3>
              <p className="text-muted-foreground mb-6">Start by creating your first link or group</p>
              <div className="flex items-center justify-center gap-3">
                <Button onClick={() => setIsCreatingGroup(true)} variant="outline">
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Create Group
                </Button>
                <Button onClick={() => startCreate(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Link
                </Button>
              </div>
            </motion.div>
          ) : (
            <>
              {/* DnD vertical accordion */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
              >
                <Accordion type="multiple" defaultValue={[...groupedData.data.groups.map((g) => g.id), "ungrouped"]} className="space-y-3">
                  {/* Ungrouped as first section for speed */}
                  <GroupSection
                    id={null}
                    name="Ungrouped"
                    description="Links without a group"
                    items={localUngrouped}
                    onCreateLink={startCreate}
                    onEdit={startEdit}
                    onEmptyDropHint="Drop links here"
                  />

                  {/* All groups */}
                  {localGroups.map((g) => (
                    <GroupSection
                      key={g.id}
                      id={g.id}
                      name={g.name}
                      description={g.description}
                      items={g.links}
                      onCreateLink={startCreate}
                      onDeleteGroup={deleteGroup}
                      onEdit={startEdit}
                    />
                  ))}
                </Accordion>

                <DragOverlay dropAnimation={defaultDropAnimation}>
                  {dragOverlayItem ? (
                    <div className="w-full">
                      <SortableLinkRow item={dragOverlayItem} onEdit={() => {}} />
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>

              {/* Create Group Modal */}
              <AnimatePresence>
                {isCreatingGroup && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
                    onClick={() => setIsCreatingGroup(false)}
                  >
                    <Card className="w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
                      <CardHeader>
                        <CardTitle>Create New Group</CardTitle>
                        <CardDescription>Organize your links into groups</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Group Name</label>
                          <Input
                            placeholder="e.g. Work Links"
                            value={groupForm.name}
                            onChange={(e) => setGroupForm((f) => ({ ...f, name: e.target.value }))}
                            autoFocus
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Description (Optional)</label>
                          <Input
                            placeholder="What kind of links are these?"
                            value={groupForm.description ?? ""}
                            onChange={(e) => setGroupForm((f) => ({ ...f, description: e.target.value }))}
                          />
                        </div>
                        <div className="flex gap-2 pt-4">
                          <Button onClick={createGroup} className="flex-1">Create Group</Button>
                          <Button variant="ghost" onClick={() => setIsCreatingGroup(false)}>Cancel</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Create/Edit Link Modal */}
              <AnimatePresence>
                {(isCreating || editingLinkId) && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
                    onClick={cancel}
                  >
                    <Card className="w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
                      <CardHeader>
                        <CardTitle>{editingLinkId ? "Edit Link" : "Create New Link"}</CardTitle>
                        <CardDescription>Add a new link to your collection</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block">Link Name</label>
                            <Input
                              placeholder="e.g. Google"
                              value={form.name}
                              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                              autoFocus
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-2 block">URL</label>
                            <Input
                              placeholder="https://..."
                              value={form.url}
                              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Description (Optional)</label>
                          <Input
                            placeholder="What is this link for?"
                            value={form.description ?? ""}
                            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Group</label>
                          <select
                            value={form.groupId ?? "ungrouped"}
                            onChange={(e) => setForm((f) => ({ ...f, groupId: e.target.value === "ungrouped" ? null : e.target.value }))}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="ungrouped">Ungrouped</option>
                            {(groupedData?.data?.groups ?? []).map((g) => (
                              <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex gap-2 pt-4">
                          <Button onClick={saveLink} className="flex-1">
                            {editingLinkId ? "Save Changes" : "Create Link"}
                          </Button>
                          <Button variant="ghost" onClick={cancel}>Cancel</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
