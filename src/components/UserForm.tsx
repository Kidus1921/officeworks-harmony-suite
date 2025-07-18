import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Role {
  id: string;
  role_name: string;
}

interface UserData {
  id?: string;
  first_name: string;
  last_name: string;
  email: string;
  role_id: string;
  department: string;
  status: string;
}

interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserData | null;
  onSuccess: () => void;
}

export default function UserForm({ open, onOpenChange, user, onSuccess }: UserFormProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<UserData>({
    first_name: "",
    last_name: "",
    email: "",
    role_id: "",
    department: "",
    status: "Active",
  });
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchRoles();
      if (user) {
        setFormData(user);
      } else {
        setFormData({
          first_name: "",
          last_name: "",
          email: "",
          role_id: "",
          department: "",
          status: "Active",
        });
      }
    }
  }, [open, user]);

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase
        .from("roles")
        .select("id, role_name")
        .order("role_name");

      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch roles",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (user?.id) {
        // Update existing user
        const { error } = await supabase
          .from("users")
          .update({
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            role_id: formData.role_id,
            department: formData.department,
            status: formData.status,
          })
          .eq("id", user.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "User updated successfully",
        });
      } else {
        // Create new user - Note: In real app, you'd also create auth.users entry
        const { error } = await supabase
          .from("users")
          .insert([{
            // For demo purposes, we'll use a dummy user_id
            // In real implementation, you'd create the auth user first
            user_id: crypto.randomUUID(),
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            role_id: formData.role_id,
            department: formData.department,
            status: formData.status,
          }]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "User created successfully",
        });
      }

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {user ? "Edit User" : "Create New User"}
          </DialogTitle>
          <DialogDescription>
            {user 
              ? "Update the user details below."
              : "Add a new user to the system."
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, role_id: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.role_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
                placeholder="e.g., Engineering, Marketing"
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
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
              {loading ? "Saving..." : user ? "Update" : "Create"} User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}