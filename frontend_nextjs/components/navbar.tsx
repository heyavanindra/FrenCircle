"use client";

import { Menu, LogOut, User, Sun, Moon, Settings, UserCircle, BarChart3, Layout, Shield } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser, userHelpers } from "@/contexts/UserContext";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import { navigationLinks } from "@/data/ui/navigationLinks";
import Link from "next/link";



export default function Navbar() {
  const { user, logout, isAuthenticated } = useUser();
  const { theme, toggleTheme } = useTheme();

  const handleLoginClick = () => {
    // Navigation is now handled by Link components
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatarUrl || "/placeholder-avatar.jpg"} alt="User Avatar" />
                      <AvatarFallback>{userHelpers.getInitials(user)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {userHelpers.getFullName(user)}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
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
                    <Link href="/account/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled className="cursor-not-allowed opacity-50">
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
                  <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/account/login">
                <Button variant="default" size="sm">
                  <User className="h-3 w-3 mr-1" />
                  Login
                </Button>
              </Link>
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
                      <Link href="/account/login" className="block">
                        <Button variant="default" size="sm" className="w-full">
                          <User className="h-3 w-3 mr-1" />
                          Login
                        </Button>
                      </Link>
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
                  
                  {/* User menu items in mobile (only show if authenticated) */}
                  {isAuthenticated && (
                    <>
                      <div className="border-t pt-3 mt-3">
                        <Link
                          href="/account/profile"
                          className="flex items-center rounded-md px-3 py-2 text-base font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
                        >
                          <UserCircle className="h-4 w-4 mr-2" />
                          Profile
                        </Link>
                        <Link
                          href="/account/insights"
                          className="flex items-center rounded-md px-3 py-2 text-base font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
                        >
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Insights
                        </Link>
                        <Link
                          href="/account/settings"
                          className="flex items-center rounded-md px-3 py-2 text-base font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </Link>
                        <div className="border-t pt-3 mt-3 space-y-1">
                          <div className="flex items-center rounded-md px-3 py-2 text-base font-medium text-muted-foreground opacity-50">
                            <Layout className="h-4 w-4 mr-2" />
                            Dashboard
                            <span className="ml-auto text-xs">Soon</span>
                          </div>
                          <Link
                            href="/account/security"
                            className="flex items-center rounded-md px-3 py-2 text-base font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Security
                          </Link>
                        </div>
                      </div>
                    </>
                  )}
                  
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
                      className="w-full justify-start mt-3 text-red-600 hover:text-red-700"
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