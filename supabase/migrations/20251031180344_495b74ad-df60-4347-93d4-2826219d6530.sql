-- Create teams table
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  sport TEXT NOT NULL,
  skill_level INTEGER DEFAULT 1,
  max_members INTEGER DEFAULT 10,
  captain_id UUID REFERENCES public.profiles(id),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create team members table
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Create tournaments table
CREATE TABLE public.tournaments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  sport TEXT NOT NULL,
  facility_id UUID REFERENCES public.facilities(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  max_teams INTEGER DEFAULT 8,
  entry_fee NUMERIC DEFAULT 0,
  prize_pool NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'upcoming',
  organizer_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tournament participants table
CREATE TABLE public.tournament_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, team_id)
);

-- Create player connections (following/friends)
CREATE TABLE public.player_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Create activity feed
CREATE TABLE public.activity_feed (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create player preferences for AI matching
CREATE TABLE public.player_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  preferred_sports TEXT[],
  preferred_times TEXT[],
  preferred_locations TEXT[],
  budget_range JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teams
CREATE POLICY "Anyone can view teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create teams" ON public.teams FOR INSERT WITH CHECK (auth.uid() = captain_id);
CREATE POLICY "Team captains can update their teams" ON public.teams FOR UPDATE USING (auth.uid() = captain_id);
CREATE POLICY "Team captains can delete their teams" ON public.teams FOR DELETE USING (auth.uid() = captain_id);

-- RLS Policies for team_members
CREATE POLICY "Anyone can view team members" ON public.team_members FOR SELECT USING (true);
CREATE POLICY "Team captains can add members" ON public.team_members FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.teams WHERE id = team_id AND captain_id = auth.uid())
);
CREATE POLICY "Members can leave teams" ON public.team_members FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for tournaments
CREATE POLICY "Anyone can view tournaments" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create tournaments" ON public.tournaments FOR INSERT WITH CHECK (auth.uid() = organizer_id);
CREATE POLICY "Organizers can update tournaments" ON public.tournaments FOR UPDATE USING (auth.uid() = organizer_id);

-- RLS Policies for tournament_participants
CREATE POLICY "Anyone can view participants" ON public.tournament_participants FOR SELECT USING (true);
CREATE POLICY "Team captains can register teams" ON public.tournament_participants FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.teams WHERE id = team_id AND captain_id = auth.uid())
);

-- RLS Policies for player_connections
CREATE POLICY "Users can view their connections" ON public.player_connections FOR SELECT USING (
  follower_id = auth.uid() OR following_id = auth.uid()
);
CREATE POLICY "Users can create connections" ON public.player_connections FOR INSERT WITH CHECK (follower_id = auth.uid());
CREATE POLICY "Users can remove their connections" ON public.player_connections FOR DELETE USING (follower_id = auth.uid());

-- RLS Policies for activity_feed
CREATE POLICY "Users can view activity from their connections" ON public.activity_feed FOR SELECT USING (
  user_id = auth.uid() OR 
  user_id IN (SELECT following_id FROM public.player_connections WHERE follower_id = auth.uid())
);
CREATE POLICY "Users can create their own activities" ON public.activity_feed FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies for player_preferences
CREATE POLICY "Users can view own preferences" ON public.player_preferences FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own preferences" ON public.player_preferences FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own preferences" ON public.player_preferences FOR UPDATE USING (user_id = auth.uid());

-- Create triggers for updated_at
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tournaments_updated_at BEFORE UPDATE ON public.tournaments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_player_preferences_updated_at BEFORE UPDATE ON public.player_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();