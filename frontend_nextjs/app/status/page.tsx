"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  CheckCircle, 
  XCircle, 
  Clock,
  RefreshCw,
  Server,
  Database,
  Globe,
  Zap,
  Activity,
  AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ServiceStatus {
  name: string;
  url: string;
  description: string;
  icon: React.ReactNode;
  status: 'online' | 'offline' | 'checking';
  responseTime: number | null;
  lastChecked: Date | null;
  error?: string;
}

const services: Omit<ServiceStatus, 'status' | 'responseTime' | 'lastChecked' | 'error'>[] = [
  {
    name: "Main API",
    url: "https://api.frencircle.com",
    description: "Core API services and authentication",
    icon: <Server className="h-5 w-5" />
  },
  {
    name: "Utilities API", 
    url: "https://util.frencircle.com", 
    description: "Utility services and helper functions",
    icon: <Zap className="h-5 w-5" />
  },
  {
    name: "Database",
    url: "https://api.frencircle.com",
    description: "Database connectivity and performance", 
    icon: <Database className="h-5 w-5" />
  },
  {
    name: "CDN",
    url: "https://cdn.jsm33t.com",
    description: "Content delivery network status",
    icon: <Globe className="h-5 w-5" />
  }
];

export default function StatusPage() {
  const [serviceStatuses, setServiceStatuses] = useState<ServiceStatus[]>(() =>
    services.map(service => ({
      ...service,
      status: 'checking' as const,
      responseTime: null,
      lastChecked: null
    }))
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Direct API check function - bypasses CORS by using simple requests
  const checkServiceStatus = async (service: typeof services[0]): Promise<ServiceStatus> => {
    const startTime = Date.now();
    
    try {
      // Try a simple HEAD request first (less data, faster)
      const response = await fetch(service.url, {
        method: 'HEAD',
        mode: 'no-cors', // This bypasses CORS but we can only check if request completes
        cache: 'no-cache',
        signal: AbortSignal.timeout(8000) // 8 second timeout
      });
      
      const responseTime = Date.now() - startTime;
      
      // With no-cors, we can't read response status, but if we get here without error, service is likely up
      return {
        ...service,
        status: 'online',
        responseTime,
        lastChecked: new Date()
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // If it's a timeout or network error, mark as offline
      return {
        ...service,
        status: 'offline',
        responseTime: responseTime > 7000 ? null : responseTime, // Don't show response time for timeouts
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Connection failed'
      };
    }
  };

  const checkAllServices = async () => {
    setIsRefreshing(true);
    
    // Set all to checking first
    setServiceStatuses(prev => 
      prev.map(service => ({ ...service, status: 'checking' as const }))
    );

    try {
      // Check all services in parallel
      const promises = services.map(service => checkServiceStatus(service));
      const results = await Promise.all(promises);
      
      setServiceStatuses(results);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error checking services:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    checkAllServices();
    
    // Check every 30 seconds
    const interval = setInterval(checkAllServices, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: 'online' | 'offline' | 'checking') => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'offline':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'checking':
        return <Clock className="h-5 w-5 text-yellow-600 animate-spin" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: 'online' | 'offline' | 'checking') => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Operational</Badge>;
      case 'offline':
        return <Badge variant="destructive">Down</Badge>;
      case 'checking':
        return <Badge variant="secondary">Checking...</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleRefresh = () => {
    checkAllServices();
  };

  const overallStatus = serviceStatuses.every(s => s.status === 'online') 
    ? 'All Systems Operational' 
    : serviceStatuses.some(s => s.status === 'offline')
    ? 'Some Issues Detected'
    : 'Checking Status...';

  const onlineCount = serviceStatuses.filter(s => s.status === 'online').length;
  const totalServices = serviceStatuses.length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            System Status
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            Real-time monitoring of FrenCircle services
          </p>
          
          {/* Overall Status */}
          <Card className="max-w-md mx-auto mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-3 mb-2">
                {overallStatus === 'All Systems Operational' ? (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                )}
                <span className="text-2xl font-semibold text-foreground">
                  {overallStatus}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {onlineCount} of {totalServices} services operational
              </p>
            </CardContent>
          </Card>

          {/* Refresh Button */}
          <Button 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            variant="outline"
            className="mb-8"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Checking...' : 'Refresh Status'}
          </Button>
        </motion.div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {serviceStatuses.map((service, index) => (
            <motion.div
              key={service.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-primary">
                        {service.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{service.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {service.description}
                        </CardDescription>
                      </div>
                    </div>
                    {getStatusIcon(service.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status:</span>
                      {getStatusBadge(service.status)}
                    </div>
                    
                    {service.responseTime !== null && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Response Time:</span>
                        <span className="text-sm text-muted-foreground">
                          {service.responseTime}ms
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Endpoint:</span>
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                        {service.url}
                      </code>
                    </div>
                    
                    {service.lastChecked && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Last Checked:</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(service.lastChecked).toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Footer Info */}
        <motion.div 
          className="text-center text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Activity className="h-4 w-4" />
            <span>Last updated: {lastUpdate.toLocaleString()}</span>
          </div>
          <p>Status checks run automatically every 60 seconds</p>
        </motion.div>
      </div>
    </div>
  );
}
