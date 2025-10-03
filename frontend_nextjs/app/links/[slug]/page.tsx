"use client";

import React, { useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Globe, ExternalLink, Sun, Moon } from "lucide-react";
import { toast } from "sonner";

// no user guard in public profile view
import { useNavbarVisibility } from "@/contexts/NavbarVisibilityContext";
import { useUser } from "@/contexts/UserContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useGet } from "@/hooks/useApi";
import { GetGroupedLinksResponse, LinkItem } from "@/hooks/types";

/* ---------- FX presets ---------- */
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};
const cardVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.25 } },
};

/* ---------- Simple (non-sortable) row ---------- */
function LinkRow({ item }: { item: LinkItem }) {
  return (
    <div className="group/link flex items-center gap-3 rounded-lg border bg-background/60 hover:bg-accent/50 transition-all p-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-sm truncate hover:text-primary transition-colors"
          >
            {item.name}
          </a>
          <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
        </div>
        {item.description && (
          <p className="text-xs text-muted-foreground mt-1 truncate">{item.description}</p>
        )}
      </div>
    </div>
  );
}

/* ---------- Group section (read-only) ---------- */
function GroupSection({
  id,
  name,
  description,
  items,
}: {
  id: string | null; // null for ungrouped
  name: string;
  description?: string | null;
  items: LinkItem[];
}) {
  const containerId = id ?? "__ungrouped__";

  return (
    <AccordionItem value={containerId} className="rounded-xl border bg-card">
      <AccordionTrigger className="px-4">
        <div className="flex items-start justify-between w-full gap-3">
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${id ? "bg-gradient-to-r from-primary to-blue-500" : "bg-muted-foreground"}`} />
              <span className="font-semibold">{name}</span>
            </div>
            {description ? <p className="text-xs text-muted-foreground mt-1">{description}</p> : null}
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {items.map((link) => (
              <motion.div key={link.id} variants={cardVariants} initial="hidden" animate="visible" exit="hidden">
                <LinkRow item={link} />
              </motion.div>
            ))}
          </AnimatePresence>

          {items.length === 0 && (
            <div className="flex items-center justify-center h-24 border-2 border-dashed rounded-lg">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">No links in this group</p>
              </div>
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

/* ---------- Main Page (READ-ONLY) ---------- */
export default function LinksPageViewOnly() {
  const params = useParams();
  const username = params?.slug as string | undefined;

  const { data: groupedData, loading: loadingLinks, error: linksError } =
    useGet<GetGroupedLinksResponse>(username ? `/link/user/${encodeURIComponent(username)}` : "/link");

  // Hide navbar while this page is mounted using in-memory context (no persistence).
  const { visible, setVisible } = useNavbarVisibility();

  // Determine ownership: if the logged-in user's username matches the slug (case-insensitive)
  const { user, isAuthenticated } = useUser();
  const isOwner = isAuthenticated && user?.username && username && user.username.toLowerCase() === username.toLowerCase();
  const { theme, toggleTheme } = useTheme();
  useEffect(() => {
    const prev = visible;
    setVisible(false);
    return () => setVisible(prev);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (linksError) {
      console.warn("Links API error:", linksError);
      toast.error("Could not load links.");
    }
  }, [linksError]);

  const sortedGroups = useMemo(() => {
    const groups = groupedData?.data?.groups ?? [];
    return [...groups]
      .sort((a, b) => a.sequence - b.sequence)
      .map((g) => ({
        ...g,
        links: [...g.links].sort((a, b) => a.sequence - b.sequence),
      }));
  }, [groupedData]);

  const ungroupedLinks = useMemo(() => {
    const un = groupedData?.data?.ungrouped?.links ?? [];
    return [...un].sort((a, b) => a.sequence - b.sequence);
  }, [groupedData]);

  // public view; if no username param and no data, show nothing or loading
  if (!username && !groupedData && !loadingLinks) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
          {/* <div>
            <Link
              href="/account/profile"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Profile
            </Link>
          </div> */}

          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Globe className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Links</h1>
              <p className="text-muted-foreground text-sm">View your links by group.</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {/* Theme toggle (visible on public preview even when navbar hidden) */}
              <Button variant="outline" size="sm" onClick={toggleTheme} className="rounded-full">
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              {/* Edit action for owner */}
              {isOwner && (
                <div>
                  <Link href="/account/links">
                    <Button variant="default" size="sm" className="rounded-full">
                      Edit
                    </Button>
                  </Link>
                </div>
              )}
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
              <h3 className="text-lg font-semibold mb-2">No links found</h3>
              <p className="text-muted-foreground">You don’t have any links yet.</p>
            </motion.div>
          ) : (
            <>
              <Accordion
                type="multiple"
                defaultValue={[...(groupedData.data.groups ?? []).map((g) => g.id), "__ungrouped__"]}
                className="space-y-3"
              >
                {/* Ungrouped first */}
                <GroupSection
                  id={null}
                  name="Ungrouped"
                  description="Links without a group"
                  items={ungroupedLinks}
                />

                {/* Groups */}
                {sortedGroups.map((g) => (
                  <GroupSection
                    key={g.id}
                    id={g.id}
                    name={g.name}
                    description={g.description}
                    items={g.links}
                  />
                ))}
              </Accordion>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
