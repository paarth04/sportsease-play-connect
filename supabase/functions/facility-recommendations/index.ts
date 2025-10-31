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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);
    if (!user) throw new Error('Not authenticated');

    // Get user booking history and preferences
    const { data: bookings } = await supabaseClient
      .from('bookings')
      .select('*, facility:facilities(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: preferences } = await supabaseClient
      .from('player_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Get all available facilities
    const { data: facilities } = await supabaseClient
      .from('facilities')
      .select('*')
      .eq('status', 'approved');

    // Use AI to recommend facilities
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
            content: 'You are a sports facility recommendation engine. Analyze user preferences and booking history to recommend the top 5 most suitable facilities. Consider sports preferences, location, budget, and past bookings. Return JSON only.'
          },
          {
            role: 'user',
            content: `Recommend facilities for:
User Preferences: ${JSON.stringify(preferences)}
Booking History: ${JSON.stringify(bookings)}
Available Facilities: ${JSON.stringify(facilities)}

Return format: { "recommendations": [{ "facility_id": "uuid", "score": 0-100, "reason": "personalized explanation" }] }`
          }
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`AI request failed: ${response.statusText}`);
    }

    const aiData = await response.json();
    const content = aiData.choices[0].message.content;
    const recommendations = JSON.parse(content);

    return new Response(
      JSON.stringify(recommendations),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in facility-recommendations:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});