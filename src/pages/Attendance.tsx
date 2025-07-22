import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { format } from "date-fns";
import { CalendarIcon, Clock, Users, UserPlus, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const attendanceSchema = z.object({
  user_id: z.string().min(1, "User is required"),
  date: z.date(),
  clock_in: z.string().optional(),
  clock_out: z.string().optional(),
  break_start: z.string().optional(),
  break_end: z.string().optional(),
  status: z.string(),
  notes: z.string().optional(),
});

const scheduleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  days_of_week: z.array(z.number()).min(1, "Select at least one day"),
});

const userScheduleSchema = z.object({
  user_id: z.string().min(1, "User is required"),
  schedule_id: z.string().min(1, "Schedule is required"),
  effective_date: z.date(),
  end_date: z.date().optional(),
});

type AttendanceForm = z.infer<typeof attendanceSchema>;
type ScheduleForm = z.infer<typeof scheduleSchema>;
type UserScheduleForm = z.infer<typeof userScheduleSchema>;

export default function Attendance() {
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isUserScheduleDialogOpen, setIsUserScheduleDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const queryClient = useQueryClient();

  const attendanceForm = useForm<AttendanceForm>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      date: new Date(),
      status: "present",
    },
  });

  const scheduleForm = useForm<ScheduleForm>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      days_of_week: [],
    },
  });

  const userScheduleForm = useForm<UserScheduleForm>({
    resolver: zodResolver(userScheduleSchema),
    defaultValues: {
      effective_date: new Date(),
    },
  });

  // Fetch attendance records
  const { data: attendance = [], isLoading: attendanceLoading } = useQuery({
    queryKey: ["attendance", selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select(`
          *,
          users(first_name, last_name, user_id_login)
        `)
        .eq("date", format(selectedDate, "yyyy-MM-dd"))
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch users
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("is_active", true)
        .order("first_name");
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch schedules
  const { data: schedules = [] } = useQuery({
    queryKey: ["schedules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schedules")
        .select("*")
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch user schedules
  const { data: userSchedules = [] } = useQuery({
    queryKey: ["user-schedules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_schedules")
        .select(`
          *,
          users(first_name, last_name, user_id_login),
          schedules(name, start_time, end_time)
        `)
        .eq("is_active", true)
        .order("effective_date", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Create attendance mutation
  const createAttendanceMutation = useMutation({
    mutationFn: async (data: AttendanceForm) => {
      const clockIn = data.clock_in ? 
        new Date(`${format(data.date, "yyyy-MM-dd")}T${data.clock_in}:00`).toISOString() : null;
      const clockOut = data.clock_out ? 
        new Date(`${format(data.date, "yyyy-MM-dd")}T${data.clock_out}:00`).toISOString() : null;
      const breakStart = data.break_start ? 
        new Date(`${format(data.date, "yyyy-MM-dd")}T${data.break_start}:00`).toISOString() : null;
      const breakEnd = data.break_end ? 
        new Date(`${format(data.date, "yyyy-MM-dd")}T${data.break_end}:00`).toISOString() : null;
      
      let totalHours = 0;
      if (clockIn && clockOut) {
        const start = new Date(clockIn);
        const end = new Date(clockOut);
        let workTime = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        
        if (breakStart && breakEnd) {
          const breakDuration = (new Date(breakEnd).getTime() - new Date(breakStart).getTime()) / (1000 * 60 * 60);
          workTime -= breakDuration;
        }
        totalHours = Math.max(0, workTime);
      }

      const { error } = await supabase.from("attendance").upsert({
        user_id: data.user_id,
        date: format(data.date, "yyyy-MM-dd"),
        clock_in: clockIn,
        clock_out: clockOut,
        break_start: breakStart,
        break_end: breakEnd,
        total_hours: totalHours,
        status: data.status,
        notes: data.notes,
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      setIsAttendanceDialogOpen(false);
      attendanceForm.reset();
      toast({ title: "Attendance record saved successfully" });
    },
    onError: (error) => {
      toast({ title: "Error saving attendance", description: error.message, variant: "destructive" });
    },
  });

  // Create schedule mutation
  const createScheduleMutation = useMutation({
    mutationFn: async (data: ScheduleForm) => {
      const { error } = await supabase.from("schedules").insert({
        name: data.name,
        description: data.description,
        start_time: data.start_time,
        end_time: data.end_time,
        days_of_week: data.days_of_week,
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      setIsScheduleDialogOpen(false);
      scheduleForm.reset();
      toast({ title: "Schedule created successfully" });
    },
    onError: (error) => {
      toast({ title: "Error creating schedule", description: error.message, variant: "destructive" });
    },
  });

  // Assign schedule to user mutation
  const assignScheduleMutation = useMutation({
    mutationFn: async (data: UserScheduleForm) => {
      const { error } = await supabase.from("user_schedules").insert({
        user_id: data.user_id,
        schedule_id: data.schedule_id,
        effective_date: format(data.effective_date, "yyyy-MM-dd"),
        end_date: data.end_date ? format(data.end_date, "yyyy-MM-dd") : null,
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-schedules"] });
      setIsUserScheduleDialogOpen(false);
      userScheduleForm.reset();
      toast({ title: "Schedule assigned successfully" });
    },
    onError: (error) => {
      toast({ title: "Error assigning schedule", description: error.message, variant: "destructive" });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      present: "default",
      late: "secondary",
      absent: "destructive",
      half_day: "outline",
    };
    return <Badge variant={variants[status] || "default"}>{status.replace("_", " ")}</Badge>;
  };

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Attendance Management</h1>
          <p className="text-muted-foreground">Track employee attendance and manage schedules</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAttendanceDialogOpen} onOpenChange={setIsAttendanceDialogOpen}>
            <DialogTrigger asChild>
              <Button><Clock className="mr-2 h-4 w-4" />Add Attendance</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Attendance Record</DialogTitle>
                <DialogDescription>Record attendance for an employee</DialogDescription>
              </DialogHeader>
              <Form {...attendanceForm}>
                <form onSubmit={attendanceForm.handleSubmit((data) => createAttendanceMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={attendanceForm.control}
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
                  
                  <FormField
                    control={attendanceForm.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date</FormLabel>
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
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={attendanceForm.control}
                      name="clock_in"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Clock In</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={attendanceForm.control}
                      name="clock_out"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Clock Out</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={attendanceForm.control}
                      name="break_start"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Break Start</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={attendanceForm.control}
                      name="break_end"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Break End</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={attendanceForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="present">Present</SelectItem>
                            <SelectItem value="late">Late</SelectItem>
                            <SelectItem value="absent">Absent</SelectItem>
                            <SelectItem value="half_day">Half Day</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={attendanceForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full" disabled={createAttendanceMutation.isPending}>
                    {createAttendanceMutation.isPending ? "Saving..." : "Save Attendance"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Settings className="mr-2 h-4 w-4" />Create Schedule</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Work Schedule</DialogTitle>
                <DialogDescription>Define a new work schedule template</DialogDescription>
              </DialogHeader>
              <Form {...scheduleForm}>
                <form onSubmit={scheduleForm.handleSubmit((data) => createScheduleMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={scheduleForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Schedule Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Morning Shift" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={scheduleForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Optional description" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={scheduleForm.control}
                      name="start_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={scheduleForm.control}
                      name="end_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={scheduleForm.control}
                    name="days_of_week"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Working Days</FormLabel>
                        <div className="grid grid-cols-3 gap-2">
                          {dayNames.map((day, index) => (
                            <div key={day} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`day-${index}`}
                                checked={field.value.includes(index)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    field.onChange([...field.value, index]);
                                  } else {
                                    field.onChange(field.value.filter(d => d !== index));
                                  }
                                }}
                              />
                              <label htmlFor={`day-${index}`} className="text-sm">{day.slice(0, 3)}</label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full" disabled={createScheduleMutation.isPending}>
                    {createScheduleMutation.isPending ? "Creating..." : "Create Schedule"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={isUserScheduleDialogOpen} onOpenChange={setIsUserScheduleDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><UserPlus className="mr-2 h-4 w-4" />Assign Schedule</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Schedule to Employee</DialogTitle>
                <DialogDescription>Assign a work schedule to an employee</DialogDescription>
              </DialogHeader>
              <Form {...userScheduleForm}>
                <form onSubmit={userScheduleForm.handleSubmit((data) => assignScheduleMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={userScheduleForm.control}
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
                  
                  <FormField
                    control={userScheduleForm.control}
                    name="schedule_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Schedule</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select schedule" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {schedules.map((schedule) => (
                              <SelectItem key={schedule.id} value={schedule.id}>
                                {schedule.name} ({schedule.start_time} - {schedule.end_time})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={userScheduleForm.control}
                    name="effective_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Effective Date</FormLabel>
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
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full" disabled={assignScheduleMutation.isPending}>
                    {assignScheduleMutation.isPending ? "Assigning..." : "Assign Schedule"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Daily Attendance - {format(selectedDate, "PPP")}
                </CardTitle>
                <CardDescription>View and manage attendance records</CardDescription>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Change Date
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardHeader>
          <CardContent>
            {attendanceLoading ? (
              <div>Loading attendance records...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Clock In</TableHead>
                    <TableHead>Clock Out</TableHead>
                    <TableHead>Break</TableHead>
                    <TableHead>Total Hours</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No attendance records for this date
                      </TableCell>
                    </TableRow>
                  ) : (
                    attendance.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          {record.users?.first_name} {record.users?.last_name}
                          <div className="text-sm text-muted-foreground">{record.users?.user_id_login}</div>
                        </TableCell>
                        <TableCell>
                          {record.clock_in ? format(new Date(record.clock_in), "HH:mm") : "-"}
                        </TableCell>
                        <TableCell>
                          {record.clock_out ? format(new Date(record.clock_out), "HH:mm") : "-"}
                        </TableCell>
                        <TableCell>
                          {record.break_start && record.break_end 
                            ? `${format(new Date(record.break_start), "HH:mm")} - ${format(new Date(record.break_end), "HH:mm")}`
                            : "-"
                          }
                        </TableCell>
                        <TableCell>{record.total_hours ? `${record.total_hours}h` : "-"}</TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                        <TableCell>{record.notes || "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Employee Schedules
            </CardTitle>
            <CardDescription>Current schedule assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Working Hours</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Effective Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userSchedules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No schedule assignments found
                    </TableCell>
                  </TableRow>
                ) : (
                  userSchedules.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        {assignment.users?.first_name} {assignment.users?.last_name}
                        <div className="text-sm text-muted-foreground">{assignment.users?.user_id_login}</div>
                      </TableCell>
                      <TableCell>{assignment.schedules?.name}</TableCell>
                      <TableCell>
                        {assignment.schedules?.start_time} - {assignment.schedules?.end_time}
                      </TableCell>
                      <TableCell>
                        {schedules.find(s => s.id === assignment.schedule_id)?.days_of_week
                          ?.map(day => dayNames[day].slice(0, 3))
                          .join(", ") || "-"
                        }
                      </TableCell>
                      <TableCell>{format(new Date(assignment.effective_date), "PPP")}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}