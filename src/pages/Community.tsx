import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Trophy, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Team {
  id: string;
  name: string;
  sport: string;
  skill_level: number;
  description: string;
  captain_id: string;
}

interface Tournament {
  id: string;
  name: string;
  sport: string;
  start_date: string;
  end_date: string;
  status: string;
  max_teams: number;
  entry_fee: number;
  prize_pool: number;
}

interface Player {
  id: string;
  full_name: string;
  skill_level: number;
  location: string;
}

const Community = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
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
      const [teamsRes, tournamentsRes, playersRes] = await Promise.all([
        supabase.from("teams").select("*"),
        supabase.from("tournaments").select("*").order("start_date", { ascending: true }),
        supabase.from("profiles").select("id, full_name, skill_level, location").limit(10),
      ]);

      if (teamsRes.data) setTeams(teamsRes.data);
      if (tournamentsRes.data) setTournaments(tournamentsRes.data);
      if (playersRes.data) setPlayers(playersRes.data);
    } catch (error) {
      console.error("Error fetching community data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowPlayer = async (playerId: string) => {
    try {
      const { error } = await supabase
        .from("player_connections")
        .insert({
          follower_id: user!.id,
          following_id: playerId,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "You are now following this player",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Community</h1>
          <p className="text-muted-foreground">Connect with players, join teams, and compete in tournaments</p>
        </div>

        <Tabs defaultValue="teams" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="teams">
              <Users className="h-4 w-4 mr-2" />
              Teams
            </TabsTrigger>
            <TabsTrigger value="tournaments">
              <Trophy className="h-4 w-4 mr-2" />
              Tournaments
            </TabsTrigger>
            <TabsTrigger value="players">
              <UserPlus className="h-4 w-4 mr-2" />
              Players
            </TabsTrigger>
          </TabsList>

          <TabsContent value="teams">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((team) => (
                <Card key={team.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {team.name}
                      <Badge variant="secondary">{team.sport}</Badge>
                    </CardTitle>
                    <CardDescription>{team.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Skill Level</span>
                        <Badge variant="outline">{team.skill_level}/10</Badge>
                      </div>
                      <Button className="w-full" variant="outline">
                        View Team
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tournaments">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tournaments.map((tournament) => (
                <Card key={tournament.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {tournament.name}
                      <Badge>{tournament.status}</Badge>
                    </CardTitle>
                    <CardDescription>
                      {new Date(tournament.start_date).toLocaleDateString()} - {new Date(tournament.end_date).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Sport</span>
                        <Badge variant="secondary">{tournament.sport}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Entry Fee</span>
                        <span className="font-semibold">₹{tournament.entry_fee}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Prize Pool</span>
                        <span className="font-semibold text-primary">₹{tournament.prize_pool}</span>
                      </div>
                      <Button className="w-full">Register Team</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="players">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {players.map((player) => (
                <Card key={player.id}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {player.full_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{player.full_name}</CardTitle>
                        <CardDescription>{player.location}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Skill Level</span>
                        <Badge variant="outline">{player.skill_level}/10</Badge>
                      </div>
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => handleFollowPlayer(player.id)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Follow
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Community;