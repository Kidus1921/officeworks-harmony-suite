-- Create schedules table for office hour templates
CREATE TABLE public.schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  days_of_week INTEGER[] NOT NULL, -- Array of day numbers (0=Sunday, 1=Monday, etc.)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_schedules table to assign schedules to users
CREATE TABLE public.user_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  schedule_id UUID NOT NULL REFERENCES public.schedules(id) ON DELETE CASCADE,
  effective_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, schedule_id, effective_date)
);

-- Create attendance table
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  clock_in TIMESTAMP WITH TIME ZONE,
  clock_out TIMESTAMP WITH TIME ZONE,
  break_start TIMESTAMP WITH TIME ZONE,
  break_end TIMESTAMP WITH TIME ZONE,
  total_hours DECIMAL(4,2),
  overtime_hours DECIMAL(4,2) DEFAULT 0,
  status VARCHAR DEFAULT 'present', -- present, absent, late, half_day
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Create leave_requests table
CREATE TABLE public.leave_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  leave_type VARCHAR NOT NULL, -- annual, sick, personal, maternity, emergency
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_requested INTEGER NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR DEFAULT 'pending', -- pending, approved, rejected, cancelled
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for schedules (admins and HR can manage)
CREATE POLICY "Admins and HR can manage schedules" 
ON public.schedules 
FOR ALL 
USING (true);

CREATE POLICY "All authenticated users can view schedules" 
ON public.schedules 
FOR SELECT 
USING (true);

-- RLS Policies for user_schedules
CREATE POLICY "Admins and HR can manage user schedules" 
ON public.user_schedules 
FOR ALL 
USING (true);

CREATE POLICY "Users can view their own schedules" 
ON public.user_schedules 
FOR SELECT 
USING (true);

-- RLS Policies for attendance
CREATE POLICY "Admins and HR can manage all attendance" 
ON public.attendance 
FOR ALL 
USING (true);

CREATE POLICY "Users can view their own attendance" 
ON public.attendance 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own attendance" 
ON public.attendance 
FOR UPDATE 
USING (true);

-- RLS Policies for leave_requests
CREATE POLICY "Admins and HR can manage all leave requests" 
ON public.leave_requests 
FOR ALL 
USING (true);

CREATE POLICY "Users can view their own leave requests" 
ON public.leave_requests 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own leave requests" 
ON public.leave_requests 
FOR INSERT 
WITH CHECK (true);

-- Create triggers for updated_at columns
CREATE TRIGGER update_schedules_updated_at
BEFORE UPDATE ON public.schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_schedules_updated_at
BEFORE UPDATE ON public.user_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at
BEFORE UPDATE ON public.attendance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leave_requests_updated_at
BEFORE UPDATE ON public.leave_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default office hour schedules
INSERT INTO public.schedules (name, description, start_time, end_time, days_of_week) VALUES
('Standard Full-Time', 'Regular 9-5 Monday to Friday schedule', '09:00:00', '17:00:00', '{1,2,3,4,5}'),
('Early Shift', 'Early morning shift 7-3 Monday to Friday', '07:00:00', '15:00:00', '{1,2,3,4,5}'),
('Late Shift', 'Late shift 1-9 Monday to Friday', '13:00:00', '21:00:00', '{1,2,3,4,5}'),
('Part-Time', 'Part-time 9-1 Monday to Friday', '09:00:00', '13:00:00', '{1,2,3,4,5}');