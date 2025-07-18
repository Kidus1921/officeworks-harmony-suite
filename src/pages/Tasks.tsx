import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreHorizontal, Filter, Calendar } from "lucide-react";

const tasks = [
  {
    id: 1,
    title: "Review Q4 Budget Report",
    description: "Analyze quarterly financial performance and prepare recommendations",
    assignee: { name: "Sarah Johnson", avatar: "/avatars/02.png" },
    priority: "High",
    status: "In Progress",
    dueDate: "2024-01-15",
    progress: 65,
    department: "Finance"
  },
  {
    id: 2,
    title: "Update Employee Handbook",
    description: "Revise policies and procedures documentation",
    assignee: { name: "Mike Chen", avatar: "/avatars/03.png" },
    priority: "Medium",
    status: "Pending",
    dueDate: "2024-01-20",
    progress: 20,
    department: "HR"
  },
  {
    id: 3,
    title: "Prepare Board Meeting",
    description: "Organize agenda and presentation materials",
    assignee: { name: "Lisa Wang", avatar: "/avatars/04.png" },
    priority: "High",
    status: "Completed",
    dueDate: "2024-01-10",
    progress: 100,
    department: "Executive"
  },
  {
    id: 4,
    title: "Website Security Audit",
    description: "Comprehensive security assessment and vulnerability testing",
    assignee: { name: "John Doe", avatar: "/avatars/01.png" },
    priority: "High",
    status: "In Progress",
    dueDate: "2024-01-25",
    progress: 40,
    department: "IT"
  },
];

const stats = [
  { label: "Total Tasks", value: "127", change: "+8" },
  { label: "In Progress", value: "42", change: "+5" },
  { label: "Completed", value: "78", change: "+12" },
  { label: "Overdue", value: "7", change: "-3" },
];

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "High": return "destructive";
    case "Medium": return "default";
    case "Low": return "secondary";
    default: return "secondary";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Completed": return "bg-success text-success-foreground";
    case "In Progress": return "bg-primary text-primary-foreground";
    case "Pending": return "bg-warning text-warning-foreground";
    default: return "";
  }
};

export default function Tasks() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Task Management</h1>
          <p className="text-muted-foreground">Track and manage all organizational tasks</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Task
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-2xl">{stat.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                <span className="text-success">{stat.change}</span> from last week
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tasks Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Tasks</CardTitle>
              <CardDescription>Track progress and manage task assignments</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search tasks..." className="pl-8 w-64" />
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-medium">{task.title}</div>
                      <div className="text-sm text-muted-foreground max-w-md truncate">
                        {task.description}
                      </div>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {task.department}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={task.assignee.avatar} />
                        <AvatarFallback>{task.assignee.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{task.assignee.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(task.status)}>
                      {task.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{task.progress}%</span>
                      </div>
                      <Progress value={task.progress} className="h-2 w-20" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>View details</DropdownMenuItem>
                        <DropdownMenuItem>Edit task</DropdownMenuItem>
                        <DropdownMenuItem>Reassign</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Mark complete</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Delete task
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}