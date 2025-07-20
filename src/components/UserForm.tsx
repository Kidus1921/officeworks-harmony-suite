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
  user_id_login?: string;
  password_hash?: string;
  is_active?: boolean;
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
    user_id_login: "",
    is_active: true,
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
          user_id_login: "",
          is_active: true,
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

  const generateUserIdAndPassword = async (roleId: string) => {
    try {
      // Get role name
      const role = roles.find(r => r.id === roleId);
      if (!role) return { user_id: "", password: "" };

      // Generate user ID
      const { data: userIdData, error: userIdError } = await supabase
        .rpc('generate_user_id', { role_name: role.role_name });

      if (userIdError) throw userIdError;

      // Generate password
      const password = Math.random().toString(36).slice(-8).toUpperCase();

      return { user_id: userIdData, password };
    } catch (error) {
      console.error("Error generating user credentials:", error);
      return { user_id: "", password: "" };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (user?.id) {
        // Update existing user
        const updateData: any = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          role_id: formData.role_id,
          department: formData.department,
          status: formData.status,
        };

        // Include user_id_login if it's provided and different
        if (formData.user_id_login && formData.user_id_login !== user.user_id_login) {
          // Check for duplication
          const { data: existingUser } = await supabase
            .from("users")
            .select("id")
            .eq("user_id_login", formData.user_id_login)
            .neq("id", user.id)
            .single();

          if (existingUser) {
            throw new Error("User ID already exists. Please choose a different one.");
          }
          updateData.user_id_login = formData.user_id_login;
        }

        const { error } = await supabase
          .from("users")
          .update(updateData)
          .eq("id", user.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "User updated successfully",
        });
      } else {
        // Create new user
        let userIdLogin = formData.user_id_login;
        let password = "";

        if (!userIdLogin) {
          // Auto-generate user ID and password
          const credentials = await generateUserIdAndPassword(formData.role_id);
          userIdLogin = credentials.user_id;
          password = credentials.password;
        } else {
          // Check for duplication
          const { data: existingUser } = await supabase
            .from("users")
            .select("id")
            .eq("user_id_login", userIdLogin)
            .single();

          if (existingUser) {
            throw new Error("User ID already exists. Please choose a different one.");
          }
          password = Math.random().toString(36).slice(-8).toUpperCase();
        }

        // Hash password (in real app, you'd hash this properly)
        const passwordHash = btoa(password); // Simple base64 encoding for demo

        const { error } = await supabase
          .from("users")
          .insert([{
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            role_id: formData.role_id,
            department: formData.department,
            status: formData.status,
            user_id_login: userIdLogin,
            password_hash: passwordHash,
            is_active: true,
          }]);

        if (error) throw error;

        toast({
          title: "Success",
          description: `User created successfully! User ID: ${userIdLogin}, Password: ${password}`,
          duration: 10000,
        });

        // TODO: Send email with credentials here
        console.log(`User credentials - ID: ${userIdLogin}, Password: ${password}`);
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
              <Label htmlFor="user_id_login">User ID (Optional - Auto-generated if empty)</Label>
              <Input
                id="user_id_login"
                value={formData.user_id_login}
                onChange={(e) =>
                  setFormData({ ...formData, user_id_login: e.target.value })
                }
                placeholder="Leave empty for auto-generation"
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