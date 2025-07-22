import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Users from "./pages/Users";
import Tasks from "./pages/Tasks";
import Meetings from "./pages/Meetings";
import Dashboard from "./pages/Dashboard";
import PersonalTodo from "./pages/PersonalTodo";
import Attendance from "./pages/Attendance";
import LeaveRequests from "./pages/LeaveRequests";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import NotFound from "./pages/NotFound";
import { AuthProvider, useAuth } from "./hooks/useAuth";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute><Layout><Users /></Layout></ProtectedRoute>} />
            <Route path="/tasks" element={<ProtectedRoute><Layout><Tasks /></Layout></ProtectedRoute>} />
            <Route path="/meetings" element={<ProtectedRoute><Layout><Meetings /></Layout></ProtectedRoute>} />
            <Route path="/personal-todo" element={<ProtectedRoute><Layout><PersonalTodo /></Layout></ProtectedRoute>} />
            <Route path="/attendance" element={<ProtectedRoute><Layout><Attendance /></Layout></ProtectedRoute>} />
            <Route path="/leave-requests" element={<ProtectedRoute><Layout><LeaveRequests /></Layout></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
