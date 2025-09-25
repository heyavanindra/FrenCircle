"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { 
  ArrowLeft, 
  Shield, 
  Lock, 
  Eye, 
  EyeOff, 
  Check,
  Smartphone,
  Monitor,
  Globe,
  LogOut,
  AlertTriangle,
  Trash2,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";
import { useGet, usePost } from "@/hooks/useApi";
import { 
  ChangePasswordRequest, 
  ChangePasswordResponse,
  GetSessionsResponse,
  LogoutSessionResponse,
  LogoutAllSessionsResponse,
  SessionData
} from "@/hooks/types";

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

interface PasswordRequirement {
  text: string;
  met: boolean;
}

export default function SecurityPage() {
  const { user, isAuthenticated } = useUser();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // API hooks
  const { data: sessionsData, loading: sessionsLoading, refetch: refetchSessions } = useGet<GetSessionsResponse>("/profile/sessions");
  const { mutate: changePassword, loading: isChangingPassword } = usePost<ChangePasswordResponse>("/profile/password");
  const { mutate: logoutSession, loading: isLoggingOutSession } = usePost<LogoutSessionResponse>("");
  const { mutate: logoutAllSessions, loading: isLoggingOutAll } = usePost<LogoutAllSessionsResponse>("/profile/sessions/logout-all");

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const passwordRequirements: PasswordRequirement[] = [
    { text: "At least 8 characters", met: passwordData.newPassword.length >= 8 },
  ];

  const isNewPasswordValid = passwordData.newPassword.length >= 8;
  const doPasswordsMatch = passwordData.newPassword === passwordData.confirmPassword && passwordData.confirmPassword !== "";
  const isPasswordFormValid = passwordData.currentPassword.trim() && isNewPasswordValid && doPasswordsMatch;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordData.currentPassword.trim()) {
      toast.error("Please enter your current password");
      return;
    }

    if (!isNewPasswordValid) {
      toast.error("New password does not meet requirements");
      return;
    }

    if (!doPasswordsMatch) {
      toast.error("New passwords do not match");
      return;
    }

    try {
      const changePasswordRequest: ChangePasswordRequest = {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      };
      
      const response = await changePassword(changePasswordRequest);
      
      if (response.status === 200) {
        toast.success("Password changed successfully! Please log in again on other devices.");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
        // Refetch sessions as they might have changed
        refetchSessions();
      }
    } catch (error: any) {
      console.error("Password change failed:", error);
      
      if (error?.status && error?.data?.title) {
        toast.error(error.data.title);
      } else if (error?.message) {
        toast.error(error.message);
      } else {
        toast.error("Failed to change password. Please try again.");
      }
    }
  };

  const handleLogoutSession = async (sessionId: string) => {
    try {
      // Use direct API call since we need dynamic endpoint
      const apiResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/sessions/${sessionId}/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (apiResponse.ok) {
        const result = await apiResponse.json();
        toast.success(result.data?.message || "Session logged out successfully");
        refetchSessions();
      } else {
        const errorData = await apiResponse.json();
        throw new Error(errorData.title || "Failed to logout session");
      }
    } catch (error: any) {
      console.error("Logout session failed:", error);
      toast.error(error.message || "Failed to logout session. Please try again.");
    }
  };

  const handleLogoutAllOtherSessions = async () => {
    try {
      const response = await logoutAllSessions();
      
      if (response.status === 200) {
        toast.success(response.data.data.message);
        refetchSessions();
      }
    } catch (error: any) {
      console.error("Logout all sessions failed:", error);
      
      if (error?.status && error?.data?.title) {
        toast.error(error.data.title);
      } else if (error?.message) {
        toast.error(error.message);
      } else {
        toast.error("Failed to logout other sessions. Please try again.");
      }
    }
  };

  const getDeviceIcon = (userAgent: string) => {
    if (userAgent.includes('Mobile') || userAgent.includes('iPhone') || userAgent.includes('Android')) {
      return <Smartphone className="h-5 w-5" />;
    }
    return <Monitor className="h-5 w-5" />;
  };

  const formatLastSeen = (lastSeenAt: string) => {
    const date = new Date(lastSeenAt);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return date.toLocaleDateString();
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">You need to be logged in to view this page.</p>
          <Link href="/account/login">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
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
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Security Settings</h1>
            </div>
            <p className="text-muted-foreground">
              Manage your account security and active sessions
            </p>
          </motion.div>

          {/* Password Change Card */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="h-5 w-5 mr-2" />
                  Change Password
                </CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="currentPassword" className="text-sm font-medium">
                      Current Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="currentPassword"
                        name="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        placeholder="Enter your current password"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordInputChange}
                        className="pl-10 pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="newPassword" className="text-sm font-medium">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Enter your new password"
                        value={passwordData.newPassword}
                        onChange={handlePasswordInputChange}
                        className="pl-10 pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    
                    {/* Password Requirements */}
                    {passwordData.newPassword && (
                      <div className="space-y-1">
                        {passwordRequirements.map((requirement, index) => (
                          <div key={index} className="flex items-center text-xs">
                            <Check 
                              className={`h-3 w-3 mr-2 ${
                                requirement.met ? 'text-green-600' : 'text-muted-foreground'
                              }`} 
                            />
                            <span className={requirement.met ? 'text-green-600' : 'text-muted-foreground'}>
                              {requirement.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-sm font-medium">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your new password"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordInputChange}
                        className="pl-10 pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    
                    {/* Password Match Indicator */}
                    {passwordData.confirmPassword && (
                      <div className="flex items-center text-xs">
                        <Check 
                          className={`h-3 w-3 mr-2 ${
                            doPasswordsMatch ? 'text-green-600' : 'text-red-600'
                          }`} 
                        />
                        <span className={doPasswordsMatch ? 'text-green-600' : 'text-red-600'}>
                          {doPasswordsMatch ? 'Passwords match' : 'Passwords do not match'}
                        </span>
                      </div>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    disabled={!isPasswordFormValid || isChangingPassword}
                    className="w-full"
                  >
                    {isChangingPassword ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        Changing Password...
                      </div>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Change Password
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Session Management Card */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Globe className="h-5 w-5 mr-2" />
                    Active Sessions
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={refetchSessions}
                      disabled={sessionsLoading}
                    >
                      <RefreshCw className={`h-4 w-4 ${sessionsLoading ? 'animate-spin' : ''}`} />
                    </Button>
                    {sessionsData?.data.sessions && sessionsData.data.sessions.length > 1 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleLogoutAllOtherSessions}
                        disabled={isLoggingOutAll}
                      >
                        {isLoggingOutAll ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        ) : (
                          <LogOut className="h-4 w-4 mr-2" />
                        )}
                        Logout All Others
                      </Button>
                    )}
                  </div>
                </CardTitle>
                <CardDescription>
                  Manage your active sessions across different devices
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sessionsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2 text-muted-foreground">Loading sessions...</span>
                  </div>
                ) : sessionsData?.data.sessions && sessionsData.data.sessions.length > 0 ? (
                  <div className="space-y-4">
                    {sessionsData.data.sessions.map((session: SessionData) => (
                      <div
                        key={session.id}
                        className={`p-4 rounded-lg border ${
                          session.isCurrentSession ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="text-muted-foreground">
                              {getDeviceIcon(session.userAgent)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <p className="font-medium text-sm">
                                  {session.userAgent.split(' ')[0]} Browser
                                </p>
                                {session.isCurrentSession && (
                                  <Badge variant="default" className="text-xs">
                                    Current Session
                                  </Badge>
                                )}
                                <Badge variant="outline" className="text-xs">
                                  {session.authMethod}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                IP: {session.ipAddress} • Last seen: {formatLastSeen(session.lastSeenAt)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Created: {new Date(session.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          {!session.isCurrentSession && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleLogoutSession(session.id)}
                              disabled={isLoggingOutSession}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <LogOut className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No active sessions found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Security Tips */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
                  Security Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <p>Use a strong, unique password that you don't use anywhere else.</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <p>Regularly review your active sessions and logout from devices you no longer use.</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <p>If you notice any suspicious activity, change your password immediately.</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <p>Always logout from shared or public computers.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}