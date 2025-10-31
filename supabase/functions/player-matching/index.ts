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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get auth user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);
    if (!user) throw new Error('Not authenticated');

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
    const { data: players } = await supabaseClient
      .from('profiles')
      .select('*, player_preferences(*)')
      .neq('id', user.id);

    // Use AI to match players
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a sports player matching assistant. Analyze player profiles and return the top 5 best matches based on skill level, preferred sports, location, and availability. Return only a JSON array of player IDs ranked by match quality.'
          },
          {
            role: 'user',
            content: `Find the best player matches for:
Current Player: ${JSON.stringify({ profile, preferences })}
Available Players: ${JSON.stringify(players)}

Return format: { "matches": [{ "id": "uuid", "score": 0-100, "reason": "brief explanation" }] }`
          }
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`AI request failed: ${response.statusText}`);
    }

    const aiData = await response.json();
    const content = aiData.choices[0].message.content;
    const matches = JSON.parse(content);

    return new Response(
      JSON.stringify(matches),
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