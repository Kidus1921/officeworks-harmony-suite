import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Calendar, Clock, MapPin, Users as UsersIcon, Edit, Trash2, Play, Pause, Square } from "lucide-react";
import MeetingForm from "@/components/MeetingForm";

interface Meeting {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
  meeting_type: string;
  status: string;
  meeting_link: string;
  organizer_id: string;
  organizer?: {
    first_name: string;
    last_name: string;
  };
  participants_count?: number;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export default function Meetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start_time: "",
    end_time: "",
    location: "",
    meeting_type: "meeting",
    meeting_link: "",
    participants: [] as string[],
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchMeetings();
    fetchUsers();
  }, []);

  const fetchMeetings = async () => {
    try {
      const { data, error } = await supabase
        .from("meetings")
        .select(`
          *,
          organizer:users!organizer_id(first_name, last_name),
          meeting_participants(count)
        `)
        .order("start_time", { ascending: true });

      if (error) throw error;
      
      const meetingsWithCounts = data?.map(meeting => ({
        ...meeting,
        participants_count: meeting.meeting_participants?.[0]?.count || 0
      })) || [];
      
      setMeetings(meetingsWithCounts);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch meetings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, first_name, last_name, email")
        .eq("status", "Active")
        .order("first_name");

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    }
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create meeting
      const { data: meeting, error: meetingError } = await supabase
        .from("meetings")
        .insert([{
          title: formData.title,
          description: formData.description,
          start_time: formData.start_time,
          end_time: formData.end_time,
          location: formData.location,
          meeting_type: formData.meeting_type,
          meeting_link: formData.meeting_link,
          organizer_id: users[0]?.id, // For now, use first user as organizer
        }])
        .select()
        .single();

      if (meetingError) throw meetingError;

      // Add participants
      if (formData.participants.length > 0 && meeting) {
        const participantData = formData.participants.map(userId => ({
          meeting_id: meeting.id,
          user_id: userId,
          status: 'invited'
        }));

        const { error: participantsError } = await supabase
          .from("meeting_participants")
          .insert(participantData);

        if (participantsError) throw participantsError;
      }

      toast({
        title: "Success",
        description: "Meeting created successfully",
      });

      setIsCreateOpen(false);
      setFormData({
        title: "",
        description: "",
        start_time: "",
        end_time: "",
        location: "",
        meeting_type: "meeting",
        meeting_link: "",
        participants: [],
      });
      fetchMeetings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create meeting",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (meetingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("meetings")
        .update({ status: newStatus })
        .eq("id", meetingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Meeting status updated",
      });

      fetchMeetings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update meeting status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    if (!confirm("Are you sure you want to delete this meeting?")) return;

    try {
      const { error } = await supabase
        .from("meetings")
        .delete()
        .eq("id", meetingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Meeting deleted successfully",
      });

      fetchMeetings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete meeting",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "in-progress":
        return "secondary";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  const filteredMeetings = meetings.filter(meeting =>
    meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    meeting.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading meetings...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Meetings</h1>
          <p className="text-muted-foreground">Manage and schedule meetings</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Schedule Meeting
        </Button>
      </div>

      <MeetingForm
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        meeting={null}
        onSuccess={() => {
          setIsCreateOpen(false);
          fetchMeetings();
        }}
      />

      <MeetingForm
        open={!!editingMeeting}
        onOpenChange={(open) => !open && setEditingMeeting(null)}
        meeting={editingMeeting}
        onSuccess={() => {
          setEditingMeeting(null);
          fetchMeetings();
        }}
      />

      <div className="w-full max-w-md">
        <Input
          placeholder="Search meetings..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid gap-4">
        {filteredMeetings.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No meetings found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? "No meetings match your search." : "Get started by scheduling your first meeting."}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Schedule Meeting
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredMeetings.map((meeting) => (
            <Card key={meeting.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{meeting.title}</CardTitle>
                    <CardDescription>{meeting.description}</CardDescription>
                  </div>
                  <Badge variant={getStatusColor(meeting.status)}>
                    {meeting.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {new Date(meeting.start_time).toLocaleDateString()}
                        </p>
                        <p className="text-muted-foreground">
                          {new Date(meeting.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                          {new Date(meeting.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    {meeting.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{meeting.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <UsersIcon className="h-4 w-4 text-muted-foreground" />
                      <span>{meeting.participants_count} participants</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{meeting.meeting_type}</Badge>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingMeeting(meeting)}
                      className="gap-2"
                    >
                      <Edit className="h-3 w-3" />
                      Edit
                    </Button>
                    
                    {meeting.status === "scheduled" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(meeting.id, "in-progress")}
                        className="gap-2"
                      >
                        <Play className="h-3 w-3" />
                        Start
                      </Button>
                    )}
                    
                    {meeting.status === "in-progress" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(meeting.id, "completed")}
                          className="gap-2"
                        >
                          <Square className="h-3 w-3" />
                          Complete
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(meeting.id, "scheduled")}
                          className="gap-2"
                        >
                          <Pause className="h-3 w-3" />
                          Hold
                        </Button>
                      </>
                    )}
                    
                    {meeting.status !== "completed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(meeting.id, "cancelled")}
                        className="gap-2"
                      >
                        Cancel
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteMeeting(meeting.id)}
                      className="gap-2"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                </div>
                {meeting.meeting_link && (
                  <div className="mt-3 pt-3 border-t">
                    <a 
                      href={meeting.meeting_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm"
                    >
                      Join Meeting →
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}