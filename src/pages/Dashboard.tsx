import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, 
  CheckSquare, 
  Users, 
  Clock, 
  Plus,
  FileText,
  UserCheck,
  Building
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DashboardStats {
  totalMeetings: number;
  totalTasks: number;
  totalUsers: number;
  upcomingMeetings: number;
  pendingTasks: number;
  completedTasks: number;
}

// Mock user role - in real app, this would come from auth context
const getUserRole = () => "admin"; // Change to "hr", "employee" for testing

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalMeetings: 0,
    totalTasks: 0,
    totalUsers: 0,
    upcomingMeetings: 0,
    pendingTasks: 0,
    completedTasks: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const userRole = getUserRole();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const [meetingsData, tasksData, usersData] = await Promise.all([
        supabase.from("meetings").select("id, status, start_time"),
        supabase.from("tasks").select("id, status"),
        supabase.from("users").select("id, status"),
      ]);

      const meetings = meetingsData.data || [];
      const tasks = tasksData.data || [];
      const users = usersData.data || [];

      const now = new Date();
      const upcomingMeetings = meetings.filter(
        m => m.status === "scheduled" && new Date(m.start_time) > now
      ).length;

      setStats({
        totalMeetings: meetings.length,
        totalTasks: tasks.length,
        totalUsers: users.filter(u => u.status === "Active").length,
        upcomingMeetings,
        pendingTasks: tasks.filter(t => t.status === "Pending").length,
        completedTasks: tasks.filter(t => t.status === "Completed").length,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch dashboard stats",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAccessibleFeatures = () => {
    switch (userRole) {
      case "admin":
        return [
          { name: "Users Management", icon: Users, path: "/users", description: "Manage all users and roles" },
          { name: "Meetings", icon: Calendar, path: "/meetings", description: "Schedule and manage meetings" },
          { name: "Tasks", icon: CheckSquare, path: "/tasks", description: "Assign and track tasks" },
          { name: "Reports", icon: FileText, path: "/reports", description: "View analytics and reports" },
        ];
      case "hr":
        return [
          { name: "Meetings", icon: Calendar, path: "/meetings", description: "Schedule and manage meetings" },
          { name: "Tasks", icon: CheckSquare, path: "/tasks", description: "Manage your tasks" },
          { name: "Attendance", icon: UserCheck, path: "/attendance", description: "Track attendance and leaves" },
          { name: "Leave Requests", icon: Building, path: "/leave-requests", description: "Manage leave requests" },
        ];
      case "employee":
      default:
        return [
          { name: "My Meetings", icon: Calendar, path: "/meetings", description: "View your meetings" },
          { name: "My Tasks", icon: CheckSquare, path: "/tasks", description: "Track your tasks" },
          { name: "Personal Todo", icon: FileText, path: "/personal-todo", description: "Manage personal tasks" },
        ];
    }
  };

  const getStatsCards = () => {
    const baseStats = [
      {
        title: "Upcoming Meetings",
        value: stats.upcomingMeetings,
        icon: Calendar,
        description: "Scheduled meetings",
        color: "text-blue-600",
      },
      {
        title: "Pending Tasks",
        value: stats.pendingTasks,
        icon: Clock,
        description: "Tasks to complete",
        color: "text-orange-600",
      },
      {
        title: "Completed Tasks",
        value: stats.completedTasks,
        icon: CheckSquare,
        description: "Finished tasks",
        color: "text-green-600",
      },
    ];

    if (userRole === "admin") {
      baseStats.unshift({
        title: "Total Users",
        value: stats.totalUsers,
        icon: Users,
        description: "Active users",
        color: "text-purple-600",
      });
    }

    return baseStats;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening.
          </p>
          <Badge variant="outline" className="mt-2">
            {userRole.toUpperCase()} ACCESS
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getStatsCards().map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {getAccessibleFeatures().map((feature, index) => (
            <Card 
              key={index} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(feature.path)}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <feature.icon className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle className="text-lg">{feature.name}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}