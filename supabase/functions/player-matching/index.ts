import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? '',
      { global: { headers: { Authorization: authHeader! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // Get user profile and preferences
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const { data: preferences } = await supabaseClient
      .from('player_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Get all other players
    const { data: allProfiles } = await supabaseClient
      .from('profiles')
      .select('*')
      .neq('id', user.id);

    // Use AI to find matching players
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{
          role: 'user',
          content: `Analyze and match players based on skill level, location, and sport preferences.
          
Current user:
- Skill Level: ${profile?.skill_level || 1}
- Location: ${profile?.location || 'Not specified'}
- Preferred Sports: ${preferences?.preferred_sports?.join(', ') || 'None'}

Available players: ${JSON.stringify(allProfiles?.slice(0, 20) || [])}

Return a JSON array of the top 5 best matches with their user IDs and a brief reason for the match. Format:
[{"userId": "uuid", "matchScore": 0-100, "reason": "brief explanation"}]`
        }],
      }),
    });

    const aiData = await aiResponse.json();
    const matches = JSON.parse(aiData.choices[0].message.content);

    return new Response(
      JSON.stringify({ matches }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in player-matching:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});