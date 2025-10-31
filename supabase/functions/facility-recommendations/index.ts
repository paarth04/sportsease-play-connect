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

    // Get user bookings history and preferences
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

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Get all available facilities
    const { data: facilities } = await supabaseClient
      .from('facilities')
      .select('*')
      .eq('status', 'approved');

    // Use AI to recommend facilities
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
          content: `Recommend sports facilities based on user history and preferences.

User Profile:
- Location: ${profile?.location || 'Not specified'}
- Preferred Sports: ${preferences?.preferred_sports?.join(', ') || 'Not specified'}
- Budget Range: ${JSON.stringify(preferences?.budget_range || {})}

Booking History: ${JSON.stringify(bookings?.map(b => ({
  facility: b.facility?.name,
  sport: b.facility?.sports,
  price: b.total_amount
})) || [])}

Available Facilities: ${JSON.stringify(facilities?.slice(0, 20) || [])}

Return a JSON array of the top 5 recommended facility IDs with reasons. Format:
[{"facilityId": "uuid", "score": 0-100, "reason": "brief personalized explanation"}]`
        }],
      }),
    });

    const aiData = await aiResponse.json();
    const recommendations = JSON.parse(aiData.choices[0].message.content);

    return new Response(
      JSON.stringify({ recommendations }),
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