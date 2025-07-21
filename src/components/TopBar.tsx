import { Bell, Search, User, LogOut, Settings, HelpCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export default function TopBar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      // Get upcoming meetings where user is a participant
      const { data: meetings, error } = await supabase
        .from("meeting_participants")
        .select(`
          id,
          status,
          meeting:meetings(
            id,
            title,
            start_time,
            end_time,
            status
          )
        `)
        .eq("user_id", user.id)
        .eq("status", "invited");

      if (error) throw error;

      const upcomingMeetings = meetings?.filter(m => {
        const meetingTime = new Date(m.meeting?.start_time || '');
        const now = new Date();
        const timeDiff = meetingTime.getTime() - now.getTime();
        return timeDiff > 0 && timeDiff <= 24 * 60 * 60 * 1000; // Next 24 hours
      }) || [];

      setNotifications(upcomingMeetings);
      setNotificationCount(upcomingMeetings.length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // TODO: Implement global search functionality
      console.log("Searching for:", searchQuery);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const userInitials = user 
    ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
    : "U";

  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      <div className="flex items-center">
        <SidebarTrigger className="mr-4" />
      </div>
      
      <form onSubmit={handleSearch} className="flex items-center flex-1 max-w-lg">
        <Search className="h-4 w-4 text-muted-foreground mr-2" />
        <Input
          placeholder="Search users, tasks, meetings..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-none bg-muted/50 focus-visible:ring-0"
        />
      </form>

      <div className="flex items-center space-x-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-destructive">
                  {notificationCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <h4 className="font-medium">Notifications</h4>
              {notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground">No new notifications</p>
              ) : (
                <div className="space-y-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="p-3 rounded-lg bg-muted/50 space-y-1"
                    >
                      <p className="text-sm font-medium">
                        Meeting Invitation: {notification.meeting?.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(notification.meeting?.start_time).toLocaleDateString()} at{" "}
                        {new Date(notification.meeting?.start_time).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.role?.role_name} • {user?.user_id_login}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem>
              <HelpCircle className="mr-2 h-4 w-4" />
              Support
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}