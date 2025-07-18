import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Users,
  CheckSquare,
  Clock,
  Calendar,
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowUpRight
} from "lucide-react";

const stats = [
  {
    name: "Total Employees",
    value: "247",
    change: "+12%",
    trend: "up",
    icon: Users,
  },
  {
    name: "Active Tasks",
    value: "89",
    change: "-3%",
    trend: "down",
    icon: CheckSquare,
  },
  {
    name: "Present Today",
    value: "234",
    change: "+8%",
    trend: "up",
    icon: Clock,
  },
  {
    name: "Meetings Today",
    value: "12",
    change: "+5%",
    trend: "up",
    icon: Calendar,
  },
];

const recentTasks = [
  { id: 1, title: "Review Q4 Budget Report", assignee: "Sarah Johnson", priority: "High", status: "In Progress" },
  { id: 2, title: "Update Employee Handbook", assignee: "Mike Chen", priority: "Medium", status: "Pending" },
  { id: 3, title: "Prepare Board Meeting", assignee: "Lisa Wang", priority: "High", status: "Completed" },
];

const upcomingMeetings = [
  { id: 1, title: "Team Standup", time: "10:00 AM", participants: 8 },
  { id: 2, title: "Client Review", time: "2:00 PM", participants: 5 },
  { id: 3, title: "Planning Session", time: "4:30 PM", participants: 12 },
];

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening today.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Quick Add
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {stat.trend === "up" ? (
                  <TrendingUp className="h-3 w-3 text-success mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-destructive mr-1" />
                )}
                <span className={stat.trend === "up" ? "text-success" : "text-destructive"}>
                  {stat.change}
                </span>
                <span className="ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Tasks</CardTitle>
              <CardDescription>Latest task assignments and updates</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              View All
              <ArrowUpRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="space-y-1">
                  <p className="font-medium">{task.title}</p>
                  <p className="text-sm text-muted-foreground">Assigned to {task.assignee}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant={task.priority === "High" ? "destructive" : task.priority === "Medium" ? "default" : "secondary"}
                  >
                    {task.priority}
                  </Badge>
                  <Badge
                    variant={task.status === "Completed" ? "default" : "outline"}
                    className={task.status === "Completed" ? "bg-success text-success-foreground" : ""}
                  >
                    {task.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Upcoming Meetings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Today's Meetings</CardTitle>
              <CardDescription>Scheduled meetings and events</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              Schedule
              <Plus className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingMeetings.map((meeting) => (
              <div key={meeting.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="space-y-1">
                  <p className="font-medium">{meeting.title}</p>
                  <p className="text-sm text-muted-foreground">{meeting.time}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{meeting.participants} participants</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Task Completion Rate</CardTitle>
            <CardDescription>This month's progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Completed</span>
                <span>78%</span>
              </div>
              <Progress value={78} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance Rate</CardTitle>
            <CardDescription>Current week average</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Present</span>
                <span>94%</span>
              </div>
              <Progress value={94} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leave Requests</CardTitle>
            <CardDescription>Pending approvals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">5</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}