"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

import {
  Menu,
  LogOut,
  User,
  Sun,
  Moon,
  Settings,
  UserCircle,
  BarChart3,
  Layout,
  Shield,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useUser, userHelpers } from "@/contexts/UserContext";
import { useTheme } from "@/contexts/ThemeContext";
import { navigationLinks } from "@/data/ui/navigationLinks";
import { useNavbarVisibility } from "@/contexts/NavbarVisibilityContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

export default function Navbar() {
  const { user, logout, isAuthenticated } = useUser();
  const { theme, toggleTheme } = useTheme();

  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showNav, setShowNav] = useState(true);

  const lastYRef = useRef(0);
  const pathname = usePathname();

  const THRESHOLD = 2; // px movement before reacting

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Headroom behavior: hide on down, show on up
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || 0;
      setScrolled(y > 8);

      // Always show at very top
      if (y <= 0) {
        setShowNav(true);
        lastYRef.current = 0;
        return;
      }

      const delta = Math.abs(y - lastYRef.current);
      if (delta > THRESHOLD) {
        const goingDown = y > lastYRef.current;
        setShowNav(!goingDown); // hide on down, show on up
        lastYRef.current = y;
      }
    };

    lastYRef.current = typeof window !== "undefined" ? window.scrollY || 0 : 0;
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Keep nav visible if the mobile menu is open
  useEffect(() => {
    if (menuOpen) setShowNav(true);
  }, [menuOpen]);

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname?.startsWith(href + "/"));

  const router = useRouter();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  // Navbar visibility is driven by in-memory context (no persistence)
  const { visible, setVisible } = useNavbarVisibility();

  // If navbar visibility is false, render nothing. Visibility is controlled in-memory by context.
  if (!visible) return null;

  return (
    <>
      <nav
      className={[
        "sticky top-0 z-50 bg-transparent",
        "transition-transform duration-300 will-change-transform",
        showNav ? "translate-y-0" : "-translate-y-full",
      ].join(" ")}
    >
      <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6 py-2">
        <div
          className={[
            "flex h-14 items-center justify-between rounded-full",
            "px-3 sm:px-4 border",
            "bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60",
            scrolled ? "shadow-md" : "shadow-sm",
          ].join(" ")}
        >
          {/* Brand */}
          <div className="flex-shrink-0">
            <Link
              href="/"
              className="text-base sm:text-lg font-semibold text-foreground hover:opacity-85 transition-opacity"
            >
              Linqyard
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:block">
            <div className="ml-6 flex items-center space-x-1">
              {navigationLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={[
                    "rounded-full px-3 py-2 text-sm font-medium transition-colors",
                    isActive(link.href)
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  ].join(" ")}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Right cluster (Desktop) */}
          <div className="hidden md:flex items-center space-x-2">
            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="rounded-full"
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={user?.avatarUrl || "/placeholder-avatar.jpg"}
                        alt="User Avatar"
                      />
                      <AvatarFallback>{userHelpers.getInitials(user)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {userHelpers.getFirstName(user)}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <button
                      className="flex w-full items-center text-left"
                      onClick={() => setVisible(!visible)}
                      aria-pressed={!visible}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-2 h-4 w-4"
                        aria-hidden
                      >
                        {visible ? (
                          <>
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <path d="M8 12h8" />
                          </>
                        ) : (
                          <>
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <path d="M6 6l12 12" />
                          </>
                        )}
                      </svg>
                      {visible ? "Hide navbar" : "Show navbar"}
                    </button>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/links" className="cursor-pointer">
                      <UserCircle className="mr-2 h-4 w-4" />
                      Links
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/profile" className="cursor-pointer">
                      <UserCircle className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/insights" className="cursor-pointer">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Insights
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/preferences" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Preferences
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled className="cursor-not-allowed opacity-60">
                    <Layout className="mr-2 h-4 w-4" />
                    Dashboard
                    <span className="ml-auto text-xs text-muted-foreground">Soon</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/security" className="cursor-pointer">
                      <Shield className="mr-2 h-4 w-4" />
                      Security
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <button
                      className="flex w-full items-center text-left text-red-600 focus:text-red-600"
                      onClick={() => setShowLogoutDialog(true)}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/account/login">
                <Button variant="default" size="sm" className="rounded-full">
                  <User className="h-3 w-3 mr-1" />
                  Login
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Open menu"
                  aria-controls="mobile-menu"
                  className="rounded-full"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[88vw] max-w-sm p-0" id="mobile-menu">
                <div className="p-5 border-b">
                  <SheetHeader>
                    <SheetTitle className="text-lg">Linqyard</SheetTitle>
                    <SheetDescription>Navigate through the app</SheetDescription>
                  </SheetHeader>
                </div>

                <ScrollArea className="h-[calc(100vh-5rem)]">
                  <div className="p-5 space-y-4">
                    {/* User section (mobile) */}
                    {isAuthenticated ? (
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={user?.avatarUrl || userHelpers.getAvatarUrl?.(user)}
                            alt="User Avatar"
                          />
                          <AvatarFallback>{userHelpers.getInitials(user)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {userHelpers.getFirstName(user)}
                          </p>
                          {user?.username && (
                            <p className="text-xs text-muted-foreground truncate">
                              @{user.username}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <SheetClose asChild>
                          <Link href="/account/login" className="block">
                            <Button variant="default" size="sm" className="w-full rounded-full">
                              <User className="h-3 w-3 mr-1" />
                              Login
                            </Button>
                          </Link>
                        </SheetClose>
                      </div>
                    )}

                    <Separator />

                    {/* Primary nav (mobile) */}
                    <div className="space-y-1">
                      {navigationLinks.map((link) => (
                        <SheetClose asChild key={link.name}>
                          <Link
                            href={link.href}
                            className={[
                              "flex items-center rounded-md px-3 py-2 text-base font-medium transition-colors",
                              isActive(link.href)
                                ? "bg-muted text-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted",
                            ].join(" ")}
                          >
                            {link.name}
                          </Link>
                        </SheetClose>
                      ))}
                    </div>

                    {isAuthenticated && (
                      <>
                        <Separator />
                        {/* Account links (mobile) */}
                        <div className="space-y-1">
                          <SheetClose asChild>
                            <Link
                              href="/account/links"
                              className="flex items-center rounded-md px-3 py-2 text-base font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted"
                            >
                              <UserCircle className="h-4 w-4 mr-2" />
                              Links
                            </Link>
                          </SheetClose>
                          <SheetClose asChild>
                            <Link
                              href="/account/profile"
                              className="flex items-center rounded-md px-3 py-2 text-base font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted"
                            >
                              <UserCircle className="h-4 w-4 mr-2" />
                              Profile
                            </Link>
                          </SheetClose>
                          <SheetClose asChild>
                            <Link
                              href="/account/insights"
                              className="flex items-center rounded-md px-3 py-2 text-base font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted"
                            >
                              <BarChart3 className="h-4 w-4 mr-2" />
                              Insights
                            </Link>
                          </SheetClose>
                          <SheetClose asChild>
                            <Link
                              href="/account/settings"
                              className="flex items-center rounded-md px-3 py-2 text-base font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted"
                            >
                              <Settings className="h-4 w-4 mr-2" />
                              Settings
                            </Link>
                          </SheetClose>

                          <div className="border-t pt-3 mt-3 space-y-1">
                            <div className="flex items-center rounded-md px-3 py-2 text-base font-medium text-muted-foreground opacity-60">
                              <Layout className="h-4 w-4 mr-2" />
                              Dashboard
                              <span className="ml-auto text-xs">Soon</span>
                            </div>
                            <SheetClose asChild>
                              <Link
                                href="/account/security"
                                className="flex items-center rounded-md px-3 py-2 text-base font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted"
                              >
                                <Shield className="h-4 w-4 mr-2" />
                                Security
                              </Link>
                            </SheetClose>
                          </div>
                        </div>
                      </>
                    )}

                    <Separator />

                    {/* Theme (mobile) */}
                    <Button
                      variant="ghost"
                      onClick={toggleTheme}
                      className="w-full justify-start"
                      aria-label="Toggle theme"
                    >
                      {theme === "light" ? (
                        <>
                          <Moon className="h-4 w-4 mr-2" />
                          Dark Mode
                        </>
                      ) : (
                        <>
                          <Sun className="h-4 w-4 mr-2" />
                          Light Mode
                        </>
                      )}
                    </Button>

                    {/* Navbar visibility toggle (mobile) */}
                    {/* <Button
                      variant="ghost"
                      onClick={() => setVisible(!visible)}
                      className="w-full justify-start"
                      aria-label="Toggle navbar visibility"
                    >
                      {visible ? (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <path d="M8 12h8" />
                          </svg>
                          Hide Navbar
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <path d="M6 6l12 12" />
                          </svg>
                          Show Navbar
                        </>
                      )}
                    </Button> */}

                    {/* Logout (mobile) */}
                    {isAuthenticated && (
                      <>
                        <SheetClose asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start mt-3 text-red-600 hover:text-red-700"
                            onClick={() => {
                              // Close the sheet first, then open the modal dialog to avoid overlay/focus issues
                              setMenuOpen(false);
                              // Small timeout to allow sheet close animation to finish
                              setTimeout(() => setShowLogoutDialog(true), 250);
                            }}
                          >
                            <LogOut className="h-3 w-3 mr-2" />
                            Logout
                          </Button>
                        </SheetClose>
                      </>
                    )}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>

    {/* Top-level Logout Confirmation Dialog (modal, compact) */}
    <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <LogOut className="h-5 w-5 mr-2 text-red-600" />
            Confirm Logout
          </DialogTitle>
          <DialogDescription>Are you sure you want to logout?</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="mr-2">
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={async () => {
              setShowLogoutDialog(false);
              try {
                // Support sync or async logout
                await Promise.resolve(logout());
              } finally {
                router.push("/");
              }
            }}
          >
            Logout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
