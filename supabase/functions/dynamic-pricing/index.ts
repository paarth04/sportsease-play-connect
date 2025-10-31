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
    const { facilityId, date, startTime, endTime } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get facility base price
    const { data: facility } = await supabaseClient
      .from('facilities')
      .select('base_price_per_hour')
      .eq('id', facilityId)
      .single();

    // Get bookings for the same time slot to determine demand
    const { data: bookings } = await supabaseClient
      .from('bookings')
      .select('*')
      .eq('facility_id', facilityId)
      .eq('booking_date', date);

    // Use AI to calculate dynamic price
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
          content: `Calculate dynamic pricing for a sports facility booking.

Base Price: ₹${facility?.base_price_per_hour}/hour
Requested Date: ${date}
Requested Time: ${startTime} - ${endTime}
Day of Week: ${new Date(date).toLocaleDateString('en-US', { weekday: 'long' })}
Existing Bookings Today: ${bookings?.length || 0}

Factors to consider:
- Peak hours (5 PM - 9 PM): +20-30%
- Weekends: +15-25%
- High demand (>5 bookings): +10-20%
- Off-peak hours (10 AM - 3 PM): -10-15%
- Weekdays morning: -15-20%

Return a JSON object with the adjusted price and brief explanation. Format:
{"adjustedPrice": number, "multiplier": number, "explanation": "brief reason for price adjustment"}`
        }],
      }),
    });

    const aiData = await aiResponse.json();
    const pricing = JSON.parse(aiData.choices[0].message.content);

    return new Response(
      JSON.stringify(pricing),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in dynamic-pricing:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});