import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface MeetingData {
  id?: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
  meeting_type: string;
  meeting_link: string;
  status: string;
}

interface MeetingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting?: MeetingData | null;
  onSuccess: () => void;
}

export default function MeetingForm({ open, onOpenChange, meeting, onSuccess }: MeetingFormProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [formData, setFormData] = useState<MeetingData>({
    title: "",
    description: "",
    start_time: "",
    end_time: "",
    location: "",
    meeting_type: "meeting",
    meeting_link: "",
    status: "scheduled",
  });
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchUsers();
      if (meeting) {
        setFormData(meeting);
        fetchMeetingParticipants(meeting.id!);
      } else {
        setFormData({
          title: "",
          description: "",
          start_time: "",
          end_time: "",
          location: "",
          meeting_type: "meeting",
          meeting_link: "",
          status: "scheduled",
        });
        setSelectedParticipants([]);
      }
    }
  }, [open, meeting]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, first_name, last_name, email")
        .eq("status", "Active")
        .order("first_name");

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    }
  };

  const fetchMeetingParticipants = async (meetingId: string) => {
    try {
      const { data, error } = await supabase
        .from("meeting_participants")
        .select("user_id")
        .eq("meeting_id", meetingId);

      if (error) throw error;
      setSelectedParticipants(data?.map(p => p.user_id) || []);
    } catch (error) {
      console.error("Failed to fetch meeting participants:", error);
    }
  };

  const handleParticipantChange = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedParticipants([...selectedParticipants, userId]);
    } else {
      setSelectedParticipants(selectedParticipants.filter(id => id !== userId));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (meeting?.id) {
        // Update existing meeting
        const { error: meetingError } = await supabase
          .from("meetings")
          .update({
            title: formData.title,
            description: formData.description,
            start_time: formData.start_time,
            end_time: formData.end_time,
            location: formData.location,
            meeting_type: formData.meeting_type,
            meeting_link: formData.meeting_link,
            status: formData.status,
          })
          .eq("id", meeting.id);

        if (meetingError) throw meetingError;

        // Update participants
        await supabase
          .from("meeting_participants")
          .delete()
          .eq("meeting_id", meeting.id);

        if (selectedParticipants.length > 0) {
          const participantData = selectedParticipants.map(userId => ({
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
          description: "Meeting updated successfully",
        });
      } else {
        // Create new meeting
        const { data: newMeeting, error: meetingError } = await supabase
          .from("meetings")
          .insert([{
            title: formData.title,
            description: formData.description,
            start_time: formData.start_time,
            end_time: formData.end_time,
            location: formData.location,
            meeting_type: formData.meeting_type,
            meeting_link: formData.meeting_link,
            status: formData.status,
            organizer_id: users[0]?.id, // For now, use first user as organizer
          }])
          .select()
          .single();

        if (meetingError) throw meetingError;

        // Add participants
        if (selectedParticipants.length > 0 && newMeeting) {
          const participantData = selectedParticipants.map(userId => ({
            meeting_id: newMeeting.id,
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
      }

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save meeting",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {meeting ? "Edit Meeting" : "Schedule New Meeting"}
          </DialogTitle>
          <DialogDescription>
            {meeting 
              ? "Update the meeting details and participants."
              : "Create a new meeting and invite participants."
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Meeting Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Conference Room A, Online, etc."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="meeting_type">Meeting Type</Label>
                <Select
                  value={formData.meeting_type}
                  onValueChange={(value) => setFormData({ ...formData, meeting_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="standup">Standup</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            </div>
            <div>
              <Label htmlFor="meeting_link">Meeting Link (Optional)</Label>
              <Input
                id="meeting_link"
                value={formData.meeting_link}
                onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                placeholder="https://zoom.us/j/..."
              />
            </div>
            <div>
              <Label>Participants</Label>
              <div className="max-h-40 overflow-y-auto border rounded-md p-3 space-y-2">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`user-${user.id}`}
                      checked={selectedParticipants.includes(user.id)}
                      onCheckedChange={(checked) => 
                        handleParticipantChange(user.id, checked as boolean)
                      }
                    />
                    <Label 
                      htmlFor={`user-${user.id}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {user.first_name} {user.last_name} ({user.email})
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : meeting ? "Update" : "Create"} Meeting
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}