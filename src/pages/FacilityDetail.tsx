import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Clock, DollarSign, Users, Star, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Facility {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  sports: string[];
  base_price_per_hour: number;
  capacity: number;
  images: string[];
  amenities: string[];
  operating_hours: any;
  contact_phone: string;
  contact_email: string;
}

const FacilityDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [facility, setFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [teamSize, setTeamSize] = useState("1");
  const [specialRequests, setSpecialRequests] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchFacility();
    }
  }, [id]);

  const fetchFacility = async () => {
    try {
      const { data, error } = await supabase
        .from("facilities")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setFacility(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load facility details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalAmount = () => {
    if (!startTime || !endTime || !facility) return 0;
    
    const start = parseInt(startTime.split(":")[0]);
    const end = parseInt(endTime.split(":")[0]);
    const hours = end - start;
    
    return hours * facility.base_price_per_hour;
  };

  const handleBooking = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to make a booking",
      });
      navigate("/auth");
      return;
    }

    if (!selectedDate || !startTime || !endTime) {
      toast({
        title: "Missing Information",
        description: "Please select date and time slots",
        variant: "destructive",
      });
      return;
    }

    setBookingLoading(true);
    try {
      const { data, error } = await supabase
        .from("bookings")
        .insert({
          user_id: user.id,
          facility_id: id,
          booking_date: selectedDate.toISOString().split("T")[0],
          start_time: startTime,
          end_time: endTime,
          team_size: parseInt(teamSize),
          special_requests: specialRequests,
          total_amount: calculateTotalAmount(),
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Booking Created!",
        description: "Redirecting to payment...",
      });

      // Redirect to payment (will implement Stripe next)
      navigate(`/bookings/${data.id}/payment`);
    } catch (error: any) {
      toast({
        title: "Booking Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setBookingLoading(false);
    }
  };

  const timeSlots = Array.from({ length: 14 }, (_, i) => {
    const hour = i + 6; // Start from 6 AM
    return `${hour.toString().padStart(2, "0")}:00`;
  });

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

  if (!facility) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Facility not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Facility Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Images */}
            <div className="rounded-lg overflow-hidden h-96 bg-muted">
              {facility.images && facility.images.length > 0 ? (
                <img
                  src={facility.images[0]}
                  alt={facility.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <MapPin className="h-24 w-24 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Facility Info */}
            <div>
              <h1 className="text-3xl font-bold mb-2">{facility.name}</h1>
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <MapPin className="h-4 w-4" />
                <span>{facility.address}, {facility.city}, {facility.state}</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {facility.sports.map((sport) => (
                  <Badge key={sport} variant="secondary">
                    {sport}
                  </Badge>
                ))}
              </div>
              <p className="text-muted-foreground">{facility.description}</p>
            </div>

            {/* Amenities */}
            {facility.amenities && facility.amenities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Amenities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {facility.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <span className="text-sm">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {facility.contact_phone && (
                  <p className="text-sm">
                    <span className="font-medium">Phone:</span> {facility.contact_phone}
                  </p>
                )}
                {facility.contact_email && (
                  <p className="text-sm">
                    <span className="font-medium">Email:</span> {facility.contact_email}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Booking */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Book This Facility</CardTitle>
                <CardDescription>
                  ₹{facility.base_price_per_hour} per hour
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Select Date</Label>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    className="rounded-md border"
                  />
                </div>

                <div>
                  <Label>Start Time</Label>
                  <Select value={startTime} onValueChange={setStartTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select start time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>End Time</Label>
                  <Select value={endTime} onValueChange={setEndTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select end time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Team Size</Label>
                  <Input
                    type="number"
                    min="1"
                    max={facility.capacity}
                    value={teamSize}
                    onChange={(e) => setTeamSize(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Special Requests (Optional)</Label>
                  <Textarea
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="Any special requirements..."
                    rows={3}
                  />
                </div>

                {startTime && endTime && (
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total Amount:</span>
                      <span className="text-2xl font-bold text-primary">
                        ₹{calculateTotalAmount()}
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={handleBooking}
                  disabled={bookingLoading || !startTime || !endTime}
                >
                  {bookingLoading ? "Processing..." : "Proceed to Payment"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FacilityDetail;
