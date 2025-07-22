import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, differenceInDays } from "date-fns";
import { CalendarIcon, Plus, CheckCircle, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const leaveRequestSchema = z.object({
  user_id: z.string().min(1, "User is required"),
  leave_type: z.string().min(1, "Leave type is required"),
  start_date: z.date(),
  end_date: z.date(),
  reason: z.string().min(1, "Reason is required"),
}).refine((data) => data.end_date >= data.start_date, {
  message: "End date must be after or equal to start date",
  path: ["end_date"],
});

type LeaveRequestForm = z.infer<typeof leaveRequestSchema>;

export default function LeaveRequests() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<LeaveRequestForm>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      user_id: currentUser?.id || "",
      leave_type: "annual",
    },
  });

  // Check if current user is admin or HR - simplified for now
  const isAdminOrHR = true; // TODO: Implement proper role checking

  // Fetch leave requests
  const { data: leaveRequests = [], isLoading } = useQuery({
    queryKey: ["leave-requests"],
    queryFn: async () => {
      let query = supabase
        .from("leave_requests")
        .select(`
          *,
          users(first_name, last_name, user_id_login),
          approved_by_user:users!leave_requests_approved_by_fkey(first_name, last_name)
        `)
        .order("created_at", { ascending: false });

      // If not admin/HR, only show current user's requests
      if (!isAdminOrHR && currentUser?.id) {
        query = query.eq("user_id", currentUser.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Fetch users (for admin/HR)
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      if (!isAdminOrHR) return [];
      
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("is_active", true)
        .order("first_name");
      
      if (error) throw error;
      return data;
    },
    enabled: isAdminOrHR,
  });

  // Create leave request mutation
  const createLeaveRequestMutation = useMutation({
    mutationFn: async (data: LeaveRequestForm) => {
      const daysRequested = differenceInDays(data.end_date, data.start_date) + 1;
      
      const { error } = await supabase.from("leave_requests").insert({
        user_id: data.user_id,
        leave_type: data.leave_type,
        start_date: format(data.start_date, "yyyy-MM-dd"),
        end_date: format(data.end_date, "yyyy-MM-dd"),
        days_requested: daysRequested,
        reason: data.reason,
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      setIsDialogOpen(false);
      form.reset();
      toast({ title: "Leave request submitted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error submitting leave request", description: error.message, variant: "destructive" });
    },
  });

  // Approve/Reject leave request mutation
  const updateLeaveRequestMutation = useMutation({
    mutationFn: async ({ id, status, rejectionReason }: { id: string; status: string; rejectionReason?: string }) => {
      const updateData: any = {
        status,
        approved_by: currentUser?.id,
        approved_at: new Date().toISOString(),
      };

      if (rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }

      const { error } = await supabase
        .from("leave_requests")
        .update(updateData)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      toast({ title: "Leave request updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Error updating leave request", description: error.message, variant: "destructive" });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      pending: { variant: "outline", icon: Clock },
      approved: { variant: "default", icon: CheckCircle },
      rejected: { variant: "destructive", icon: XCircle },
      cancelled: { variant: "secondary", icon: XCircle },
    };
    
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getLeaveTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      annual: "bg-blue-100 text-blue-800",
      sick: "bg-red-100 text-red-800",
      personal: "bg-green-100 text-green-800",
      maternity: "bg-purple-100 text-purple-800",
      emergency: "bg-orange-100 text-orange-800",
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[type] || colors.personal}`}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };

  const handleApprove = (requestId: string) => {
    updateLeaveRequestMutation.mutate({ id: requestId, status: "approved" });
  };

  const handleReject = (requestId: string) => {
    const reason = prompt("Please provide a reason for rejection:");
    if (reason) {
      updateLeaveRequestMutation.mutate({ 
        id: requestId, 
        status: "rejected", 
        rejectionReason: reason 
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Leave Requests</h1>
          <p className="text-muted-foreground">
            {isAdminOrHR ? "Manage employee leave requests" : "View and submit your leave requests"}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Request Leave
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit Leave Request</DialogTitle>
              <DialogDescription>
                Fill out the form to request time off
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createLeaveRequestMutation.mutate(data))} className="space-y-4">
                {isAdminOrHR && (
                  <FormField
                    control={form.control}
                    name="user_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employee</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select employee" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {users.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.first_name} {user.last_name} ({user.user_id_login})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <FormField
                  control={form.control}
                  name="leave_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Leave Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="annual">Annual Leave</SelectItem>
                          <SelectItem value="sick">Sick Leave</SelectItem>
                          <SelectItem value="personal">Personal Leave</SelectItem>
                          <SelectItem value="maternity">Maternity Leave</SelectItem>
                          <SelectItem value="emergency">Emergency Leave</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? format(field.value, "PPP") : <span>Pick date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="end_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? format(field.value, "PPP") : <span>Pick date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Please provide a reason for your leave request" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full" disabled={createLeaveRequestMutation.isPending}>
                  {createLeaveRequestMutation.isPending ? "Submitting..." : "Submit Request"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leave Requests</CardTitle>
          <CardDescription>
            {isAdminOrHR ? "All employee leave requests" : "Your leave request history"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading leave requests...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {isAdminOrHR && <TableHead>Employee</TableHead>}
                  <TableHead>Type</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  {isAdminOrHR && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdminOrHR ? 8 : 7} className="text-center text-muted-foreground">
                      No leave requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  leaveRequests.map((request) => (
                    <TableRow key={request.id}>
                      {isAdminOrHR && (
                        <TableCell>
                          {request.users?.first_name} {request.users?.last_name}
                          <div className="text-sm text-muted-foreground">{request.users?.user_id_login}</div>
                        </TableCell>
                      )}
                      <TableCell>{getLeaveTypeBadge(request.leave_type)}</TableCell>
                      <TableCell>
                        {format(new Date(request.start_date), "MMM dd")} - {format(new Date(request.end_date), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>{request.days_requested} days</TableCell>
                      <TableCell className="max-w-xs truncate">{request.reason}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>{format(new Date(request.created_at), "MMM dd, yyyy")}</TableCell>
                      {isAdminOrHR && (
                        <TableCell>
                          {request.status === "pending" && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleApprove(request.id)}
                                disabled={updateLeaveRequestMutation.isPending}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReject(request.id)}
                                disabled={updateLeaveRequestMutation.isPending}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                          {request.status === "rejected" && request.rejection_reason && (
                            <div className="text-sm text-muted-foreground">
                              Reason: {request.rejection_reason}
                            </div>
                          )}
                          {request.approved_by_user && (
                            <div className="text-sm text-muted-foreground">
                              By: {request.approved_by_user.first_name} {request.approved_by_user.last_name}
                            </div>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}