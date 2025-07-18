-- Create roles table
CREATE TABLE public.roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default roles
INSERT INTO public.roles (role_name, description) VALUES 
  ('Admin', 'Full system access and user management'),
  ('HR', 'Human resources management and employee oversight'),
  ('Employee', 'Standard employee access');

-- Create users table
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  role_id UUID REFERENCES public.roles(id) NOT NULL,
  department VARCHAR(100),
  status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for roles table
CREATE POLICY "Roles are viewable by authenticated users" 
ON public.roles 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Only admins can manage roles" 
ON public.roles 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.users u 
    JOIN public.roles r ON u.role_id = r.id 
    WHERE u.user_id = auth.uid() AND r.role_name = 'Admin'
  )
);

-- RLS Policies for users table
CREATE POLICY "Users can view other users" 
ON public.users 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Only admins and HR can manage users" 
ON public.users 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.users u 
    JOIN public.roles r ON u.role_id = r.id 
    WHERE u.user_id = auth.uid() AND r.role_name IN ('Admin', 'HR')
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();