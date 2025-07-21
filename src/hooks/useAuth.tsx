import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import bcrypt from "bcryptjs";

type User = Tables<"users"> & {
  role: Tables<"roles">;
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (userIdLogin: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem("authUser");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const signIn = async (userIdLogin: string, password: string) => {
    try {
      // Get user by user_id_login
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select(`
          *,
          role:roles(*)
        `)
        .eq("user_id_login", userIdLogin)
        .eq("is_active", true)
        .single();

      if (userError || !userData) {
        throw new Error("Invalid user ID or user is inactive");
      }

      // Verify password
      if (!userData.password_hash) {
        throw new Error("Password not set for this user");
      }

      const isValidPassword = await bcrypt.compare(password, userData.password_hash);
      if (!isValidPassword) {
        throw new Error("Invalid password");
      }

      // Update last login
      await supabase
        .from("users")
        .update({ last_login: new Date().toISOString() })
        .eq("id", userData.id);

      const userWithRole = userData as User;
      setUser(userWithRole);
      localStorage.setItem("authUser", JSON.stringify(userWithRole));
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem("authUser");
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}