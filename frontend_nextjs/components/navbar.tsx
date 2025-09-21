"use client";

import { Menu, LogOut, User, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useUser, userHelpers } from "@/contexts/UserContext";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import { navigationLinks } from "@/data/ui/navigationLinks";
import Link from "next/link";



export default function Navbar() {
  const { user, logout, isAuthenticated } = useUser();
  const { theme, toggleTheme } = useTheme();

  const handleLoginClick = () => {
    toast.info("This feature is coming soon!");
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-xl font-bold text-foreground hover:opacity-80 transition-opacity">
              FrenCircle
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navigationLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Desktop Avatar & Auth Section */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </Button>
            
            {isAuthenticated ? (
              <>
                <Avatar>
                  <AvatarImage src={user?.avatarUrl || "/placeholder-avatar.jpg"} alt="User Avatar" />
                  <AvatarFallback>{userHelpers.getInitials(user)}</AvatarFallback>
                </Avatar>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="text-xs"
                >
                  <LogOut className="h-3 w-3 mr-1" />
                  Logout
                </Button>
              </>
            ) : (
              <Button variant="default" size="sm" onClick={handleLoginClick}>
                <User className="h-3 w-3 mr-1" />
                Login
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Open menu">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px]">
                <SheetHeader>
                  <SheetTitle>FrenCircle</SheetTitle>
                  <SheetDescription>
                    Navigate through the app
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 flex flex-col space-y-3">
                  {/* User section in mobile menu */}
                  {isAuthenticated ? (
                    <div className="flex items-center space-x-3 border-b pb-3">
                      <Avatar>
                        <AvatarImage src={user?.avatarUrl || "/placeholder-avatar.jpg"} alt="User Avatar" />
                        <AvatarFallback>{userHelpers.getInitials(user)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{userHelpers.getFullName(user)}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                        <p className="text-xs text-muted-foreground">@{user?.username}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="border-b pb-3">
                      <Button variant="default" size="sm" className="w-full" onClick={handleLoginClick}>
                        <User className="h-3 w-3 mr-1" />
                        Login
                      </Button>
                    </div>
                  )}
                  
                  {/* Navigation links in mobile menu */}
                  {navigationLinks.map((link) => (
                    <Link
                      key={link.name}
                      href={link.href}
                      className="block rounded-md px-3 py-2 text-base font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
                    >
                      {link.name}
                    </Link>
                  ))}
                  
                  {/* Theme Toggle in Mobile Menu */}
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
                  
                  {/* Logout button in mobile menu */}
                  {isAuthenticated && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={logout}
                      className="w-full justify-start mt-3"
                    >
                      <LogOut className="h-3 w-3 mr-2" />
                      Logout
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}