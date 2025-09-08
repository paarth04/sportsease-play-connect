-- Create enum types for better data organization
CREATE TYPE public.sport_type AS ENUM (
  'football', 'basketball', 'tennis', 'cricket', 'badminton', 
  'volleyball', 'table_tennis', 'swimming', 'gym', 'other'
);

CREATE TYPE public.user_role AS ENUM ('user', 'facility_owner', 'admin');

CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

CREATE TYPE public.facility_status AS ENUM ('pending', 'approved', 'rejected');

-- Users profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role DEFAULT 'user',
  avatar_url TEXT,
  location TEXT,
  date_of_birth DATE,
  skill_level INTEGER DEFAULT 1 CHECK (skill_level >= 1 AND skill_level <= 10),
  loyalty_points INTEGER DEFAULT 0,
  wallet_balance DECIMAL(10,2) DEFAULT 0.00,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sports facilities table
CREATE TABLE public.facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  sports sport_type[] NOT NULL,
  amenities TEXT[],
  images TEXT[],
  base_price_per_hour DECIMAL(8,2) NOT NULL,
  status facility_status DEFAULT 'pending',
  operating_hours JSONB, -- Store opening/closing times
  contact_phone TEXT,
  contact_email TEXT,
  capacity INTEGER,
  is_equipment_rental BOOLEAN DEFAULT FALSE,
  cancellation_policy TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Facility ratings and reviews
CREATE TABLE public.facility_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(facility_id, user_id) -- One review per user per facility
);

-- Bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status booking_status DEFAULT 'pending',
  total_amount DECIMAL(8,2) NOT NULL,
  payment_id TEXT, -- Stripe payment ID
  special_requests TEXT,
  team_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for facilities
CREATE POLICY "Anyone can view approved facilities" ON public.facilities 
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Facility owners can manage their facilities" ON public.facilities 
  FOR ALL USING (owner_id IN (SELECT id FROM public.profiles WHERE auth.uid() = id));

CREATE POLICY "Facility owners can insert facilities" ON public.facilities 
  FOR INSERT WITH CHECK (owner_id IN (SELECT id FROM public.profiles WHERE auth.uid() = id));

-- RLS Policies for reviews
CREATE POLICY "Anyone can view reviews" ON public.facility_reviews 
  FOR SELECT USING (TRUE);

CREATE POLICY "Users can create reviews" ON public.facility_reviews 
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM public.profiles WHERE auth.uid() = id));

CREATE POLICY "Users can update own reviews" ON public.facility_reviews 
  FOR UPDATE USING (user_id IN (SELECT id FROM public.profiles WHERE auth.uid() = id));

-- RLS Policies for bookings
CREATE POLICY "Users can view own bookings" ON public.bookings 
  FOR SELECT USING (user_id IN (SELECT id FROM public.profiles WHERE auth.uid() = id));

CREATE POLICY "Facility owners can view bookings for their facilities" ON public.bookings 
  FOR SELECT USING (facility_id IN (
    SELECT id FROM public.facilities 
    WHERE owner_id IN (SELECT id FROM public.profiles WHERE auth.uid() = id)
  ));

CREATE POLICY "Users can create bookings" ON public.bookings 
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM public.profiles WHERE auth.uid() = id));

CREATE POLICY "Users can update own bookings" ON public.bookings 
  FOR UPDATE USING (user_id IN (SELECT id FROM public.profiles WHERE auth.uid() = id));

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add timestamp triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_facilities_updated_at
  BEFORE UPDATE ON public.facilities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();