-- Add foreign key constraints to establish table relationships

-- Add foreign key for users.role_id -> roles.id
ALTER TABLE public.users 
ADD CONSTRAINT fk_users_role_id 
FOREIGN KEY (role_id) REFERENCES public.roles(id);

-- Add foreign key for attendance.user_id -> users.id
ALTER TABLE public.attendance 
ADD CONSTRAINT fk_attendance_user_id 
FOREIGN KEY (user_id) REFERENCES public.users(id);

-- Add foreign key for leave_requests.user_id -> users.id
ALTER TABLE public.leave_requests 
ADD CONSTRAINT fk_leave_requests_user_id 
FOREIGN KEY (user_id) REFERENCES public.users(id);

-- Add foreign key for leave_requests.approved_by -> users.id
ALTER TABLE public.leave_requests 
ADD CONSTRAINT fk_leave_requests_approved_by 
FOREIGN KEY (approved_by) REFERENCES public.users(id);

-- Add foreign key for user_schedules.user_id -> users.id
ALTER TABLE public.user_schedules 
ADD CONSTRAINT fk_user_schedules_user_id 
FOREIGN KEY (user_id) REFERENCES public.users(id);

-- Add foreign key for user_schedules.schedule_id -> schedules.id
ALTER TABLE public.user_schedules 
ADD CONSTRAINT fk_user_schedules_schedule_id 
FOREIGN KEY (schedule_id) REFERENCES public.schedules(id);

-- Add foreign key for tasks.assignee_id -> users.id
ALTER TABLE public.tasks 
ADD CONSTRAINT fk_tasks_assignee_id 
FOREIGN KEY (assignee_id) REFERENCES public.users(id);

-- Add foreign key for meetings.organizer_id -> users.id
ALTER TABLE public.meetings 
ADD CONSTRAINT fk_meetings_organizer_id 
FOREIGN KEY (organizer_id) REFERENCES public.users(id);

-- Add foreign key for meeting_participants.user_id -> users.id
ALTER TABLE public.meeting_participants 
ADD CONSTRAINT fk_meeting_participants_user_id 
FOREIGN KEY (user_id) REFERENCES public.users(id);

-- Add foreign key for meeting_participants.meeting_id -> meetings.id
ALTER TABLE public.meeting_participants 
ADD CONSTRAINT fk_meeting_participants_meeting_id 
FOREIGN KEY (meeting_id) REFERENCES public.meetings(id);