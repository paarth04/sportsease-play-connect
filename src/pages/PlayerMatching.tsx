import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Sparkles, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Match {
  id: string;
  score: number;
  reason: string;
  profile: {
    full_name: string;
    location: string;
    skill_level: number;
  };
}

const PlayerMatching = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user]);

  const findMatches = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("player-matching");

      if (error) throw error;

      if (data?.matches) {
        const matchesWithProfiles = await Promise.all(
          data.matches.map(async (match: any) => {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name, location, skill_level")
              .eq("id", match.id)
              .single();

            return { ...match, profile };
          })
        );
        setMatches(matchesWithProfiles);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to find matches",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (playerId: string) => {
    try {
      const { error } = await supabase
        .from("player_connections")
        .insert({
          follower_id: user!.id,
          following_id: playerId,
        });

      if (error) throw error;

      toast({
        title: "Connected!",
        description: "You are now connected with this player",
      });
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
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            AI Player Matching
          </h1>
          <p className="text-muted-foreground">
            Find the perfect teammates based on your skill level, preferences, and playing style
          </p>
        </div>

        <div className="text-center mb-8">
          <Button
            size="lg"
            onClick={findMatches}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Finding Matches...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Find My Matches
              </>
            )}
          </Button>
        </div>

        <div className="space-y-4">
          {matches.length === 0 && !loading && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  Click the button above to find your perfect matches!
                </p>
              </CardContent>
            </Card>
          )}

          {matches.map((match, index) => (
            <Card key={match.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="text-lg">
                        {match.profile?.full_name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {match.profile?.full_name || "Unknown Player"}
                        <Badge variant="secondary">#{index + 1} Match</Badge>
                      </CardTitle>
                      <CardDescription>{match.profile?.location}</CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{match.score}%</div>
                    <div className="text-xs text-muted-foreground">Match Score</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Why this is a great match:</p>
                    <p className="text-sm text-muted-foreground">{match.reason}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-muted-foreground">Skill Level: </span>
                      <Badge variant="outline">{match.profile?.skill_level || 1}/10</Badge>
                    </div>
                    <Button onClick={() => handleConnect(match.id)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Connect
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default PlayerMatching;