import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Users from "./pages/Users";
import Tasks from "./pages/Tasks";
import Meetings from "./pages/Meetings";
import Dashboard from "./pages/Dashboard";
import PersonalTodo from "./pages/PersonalTodo";
import Layout from "./components/Layout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout><Dashboard /></Layout>} />
          <Route path="/users" element={<Layout><Users /></Layout>} />
          <Route path="/tasks" element={<Layout><Tasks /></Layout>} />
          <Route path="/meetings" element={<Layout><Meetings /></Layout>} />
          <Route path="/personal-todo" element={<Layout><PersonalTodo /></Layout>} />
          <Route path="/attendance" element={<Layout><div className="p-6"><h1 className="text-3xl font-bold">Attendance</h1><p className="text-muted-foreground">Coming soon...</p></div></Layout>} />
          <Route path="/leave-requests" element={<Layout><div className="p-6"><h1 className="text-3xl font-bold">Leave Requests</h1><p className="text-muted-foreground">Coming soon...</p></div></Layout>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
