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

    // Validate inputs
    if (!facilityId || typeof facilityId !== 'string' || !facilityId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return new Response(
        JSON.stringify({ error: 'Invalid facilityId format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!date || typeof date !== 'string' || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return new Response(
        JSON.stringify({ error: 'Invalid date format. Expected YYYY-MM-DD' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!startTime || typeof startTime !== 'string' || !startTime.match(/^\d{2}:\d{2}$/)) {
      return new Response(
        JSON.stringify({ error: 'Invalid startTime format. Expected HH:MM' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!endTime || typeof endTime !== 'string' || !endTime.match(/^\d{2}:\d{2}$/)) {
      return new Response(
        JSON.stringify({ error: 'Invalid endTime format. Expected HH:MM' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Get facility details
    const { data: facility } = await supabaseClient
      .from('facilities')
      .select('*')
      .eq('id', facilityId)
      .single();

    // Get existing bookings for demand analysis
    const { data: existingBookings } = await supabaseClient
      .from('bookings')
      .select('*')
      .eq('facility_id', facilityId)
      .eq('booking_date', date);

    // Get historical bookings for the same time period
    const { data: historicalBookings } = await supabaseClient
      .from('bookings')
      .select('*')
      .eq('facility_id', facilityId)
      .gte('booking_date', new Date(new Date(date).getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .lt('booking_date', date);

    // Use AI to calculate dynamic price
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
            content: 'You are a dynamic pricing engine for sports facilities. Calculate optimal pricing based on demand, time of day, day of week, historical data, and current bookings. Consider peak hours, weekends, and booking density. Return JSON only.'
          },
          {
            role: 'user',
            content: `Calculate dynamic price for:
Facility: ${JSON.stringify(facility)}
Base Price: ₹${facility.base_price_per_hour}/hour
Requested Time: ${date} ${startTime} - ${endTime}
Current Day Bookings: ${existingBookings?.length || 0}
Historical Bookings (30 days): ${historicalBookings?.length || 0}

Return format: { "adjustedPrice": number, "multiplier": number, "factors": ["list of pricing factors"], "explanation": "brief explanation" }`
          }
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`AI request failed: ${response.statusText}`);
    }

    const aiData = await response.json();
    const content = aiData.choices[0].message.content;
    const pricingData = JSON.parse(content);

    return new Response(
      JSON.stringify({
        basePrice: facility.base_price_per_hour,
        ...pricingData
      }),
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