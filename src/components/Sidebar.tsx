import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Clock,
  Calendar,
  FileText,
  UserCheck,
  Settings,
  Building2
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Users", href: "/users", icon: Users },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Attendance", href: "/attendance", icon: Clock },
  { name: "Meetings", href: "/meetings", icon: Calendar },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Leave Requests", href: "/leave", icon: UserCheck },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  return (
    <div className="flex h-full w-64 flex-col bg-card border-r border-border">
      <div className="flex items-center h-16 px-6 border-b border-border">
        <Building2 className="h-8 w-8 text-primary" />
        <span className="ml-2 text-xl font-semibold text-foreground">
          Office Hub
        </span>
      </div>
      
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )
            }
          >
            <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
            {item.name}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}