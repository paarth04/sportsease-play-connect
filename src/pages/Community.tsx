import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Users, Trophy, UserPlus, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Team {
  id: string;
  name: string;
  sport: string;
  skill_level: number;
  max_members: number;
  captain_id: string;
  member_count: number;
}

interface Tournament {
  id: string;
  name: string;
  sport: string;
  start_date: string;
  end_date: string;
  max_teams: number;
  entry_fee: number;
  prize_pool: number;
  status: string;
  participant_count: number;
}

const Community = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch teams with member count
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select(`
          *,
          team_members(count)
        `)
        .order("created_at", { ascending: false });

      if (teamsError) throw teamsError;

      const teamsWithCount = teamsData?.map(team => ({
        ...team,
        member_count: team.team_members?.[0]?.count || 0
      })) || [];

      // Fetch tournaments with participant count
      const { data: tournamentsData, error: tournamentsError } = await supabase
        .from("tournaments")
        .select(`
          *,
          tournament_participants(count)
        `)
        .order("start_date", { ascending: true });

      if (tournamentsError) throw tournamentsError;

      const tournamentsWithCount = tournamentsData?.map(tournament => ({
        ...tournament,
        participant_count: tournament.tournament_participants?.[0]?.count || 0
      })) || [];

      setTeams(teamsWithCount);
      setTournaments(tournamentsWithCount);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTeam = async (teamId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("team_members")
        .insert({
          team_id: teamId,
          user_id: user.id,
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "You've joined the team",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Community</h1>
          <p className="text-muted-foreground">
            Join teams, compete in tournaments, and connect with players
          </p>
        </div>

        <Tabs defaultValue="teams" className="space-y-6">
          <TabsList>
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
            <TabsTrigger value="players">Players</TabsTrigger>
          </TabsList>

          <TabsContent value="teams" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Active Teams</h2>
              <Button onClick={() => navigate("/community/create-team")}>
                <Users className="mr-2 h-4 w-4" />
                Create Team
              </Button>
            </div>

            {loading ? (
              <p className="text-center text-muted-foreground">Loading teams...</p>
            ) : teams.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">No teams yet. Be the first to create one!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teams.map((team) => (
                  <Card key={team.id} className="hover:shadow-card transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {team.name}
                        <Badge>{team.sport}</Badge>
                      </CardTitle>
                      <CardDescription>
                        Skill Level: {team.skill_level} / 10
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Members</span>
                          <span className="font-medium">
                            {team.member_count} / {team.max_members}
                          </span>
                        </div>
                        <Button
                          className="w-full"
                          variant="outline"
                          onClick={() => handleJoinTeam(team.id)}
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          Join Team
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="tournaments" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Upcoming Tournaments</h2>
              <Button onClick={() => navigate("/community/create-tournament")}>
                <Trophy className="mr-2 h-4 w-4" />
                Create Tournament
              </Button>
            </div>

            {loading ? (
              <p className="text-center text-muted-foreground">Loading tournaments...</p>
            ) : tournaments.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">No tournaments scheduled. Create one!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tournaments.map((tournament) => (
                  <Card key={tournament.id} className="hover:shadow-card transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {tournament.name}
                        <Badge variant={tournament.status === 'upcoming' ? 'default' : 'secondary'}>
                          {tournament.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription>{tournament.sport}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {new Date(tournament.start_date).toLocaleDateString()} - {new Date(tournament.end_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Teams</span>
                          <span className="font-medium">
                            {tournament.participant_count} / {tournament.max_teams}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Prize Pool</span>
                          <span className="font-bold text-primary">₹{tournament.prize_pool}</span>
                        </div>
                        <Button className="w-full" onClick={() => navigate(`/tournaments/${tournament.id}`)}>
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="players" className="space-y-4">
            <div className="mb-4">
              <h2 className="text-2xl font-semibold">Find Players</h2>
              <p className="text-muted-foreground mt-2">
                AI-powered player matching coming soon
              </p>
            </div>
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">Player matching feature will be available soon!</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Community;