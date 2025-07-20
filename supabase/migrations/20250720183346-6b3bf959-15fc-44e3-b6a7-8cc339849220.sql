-- Create meetings table
CREATE TABLE public.meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location VARCHAR,
  meeting_type VARCHAR DEFAULT 'meeting',
  organizer_id UUID REFERENCES public.users(id),
  status VARCHAR DEFAULT 'scheduled',
  meeting_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- Create policies for meetings
CREATE POLICY "Allow meeting management during setup" 
ON public.meetings 
FOR ALL 
USING (true);

-- Create meeting participants table
CREATE TABLE public.meeting_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  status VARCHAR DEFAULT 'invited',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(meeting_id, user_id)
);

-- Enable RLS for meeting participants
ALTER TABLE public.meeting_participants ENABLE ROW LEVEL SECURITY;

-- Create policy for meeting participants
CREATE POLICY "Allow participant management during setup" 
ON public.meeting_participants 
FOR ALL 
USING (true);

-- Add user_id and password fields to users table for authentication
ALTER TABLE public.users ADD COLUMN user_id_login VARCHAR UNIQUE;
ALTER TABLE public.users ADD COLUMN password_hash VARCHAR;
ALTER TABLE public.users ADD COLUMN is_active BOOLEAN DEFAULT true;

-- Create trigger for updating meetings updated_at
CREATE TRIGGER update_meetings_updated_at
BEFORE UPDATE ON public.meetings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate user ID based on role
CREATE OR REPLACE FUNCTION public.generate_user_id(role_name VARCHAR)
RETURNS VARCHAR
LANGUAGE plpgsql
AS $$
DECLARE
  prefix VARCHAR;
  counter INTEGER;
  new_user_id VARCHAR;
BEGIN
  -- Determine prefix based on role
  CASE LOWER(role_name)
    WHEN 'admin' THEN prefix := 'ADM';
    WHEN 'hr' THEN prefix := 'HR';
    WHEN 'manager' THEN prefix := 'MGR';
    WHEN 'employee' THEN prefix := 'EMP';
    ELSE prefix := 'USR';
  END CASE;
  
  -- Get the next counter for this prefix
  SELECT COALESCE(MAX(CAST(SUBSTRING(user_id_login FROM LENGTH(prefix) + 1) AS INTEGER)), 0) + 1
  INTO counter
  FROM public.users
  WHERE user_id_login LIKE prefix || '%';
  
  -- Format the user ID with leading zeros
  new_user_id := prefix || LPAD(counter::TEXT, 3, '0');
  
  RETURN new_user_id;
END;
$$;