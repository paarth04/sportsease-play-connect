import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Plus, Calendar, DollarSign, Users, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Facility {
  id: string;
  name: string;
  city: string;
  sports: string[];
  status: string;
  base_price_per_hour: number;
}

interface Booking {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  total_amount: number;
  user: {
    full_name: string;
    email: string;
  };
}

const OwnerDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/auth");
      } else {
        checkUserRole();
      }
    }
  }, [user, authLoading, navigate]);

  const checkUserRole = async () => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;

      if (data.role !== "owner") {
        toast({
          title: "Access Denied",
          description: "This page is only accessible to facility owners",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      setUserRole(data.role);
      fetchOwnerData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to verify permissions",
        variant: "destructive",
      });
      navigate("/");
    }
  };

  const fetchOwnerData = async () => {
    try {
      // Fetch facilities
      const { data: facilitiesData, error: facilitiesError } = await supabase
        .from("facilities")
        .select("*")
        .eq("owner_id", user?.id);

      if (facilitiesError) throw facilitiesError;
      setFacilities(facilitiesData || []);

      // Fetch bookings for owner's facilities
      const facilityIds = facilitiesData?.map(f => f.id) || [];
      if (facilityIds.length > 0) {
        const { data: bookingsData, error: bookingsError } = await supabase
          .from("bookings")
          .select(`
            *,
            user:profiles!user_id(full_name, email)
          `)
          .in("facility_id", facilityIds)
          .order("booking_date", { ascending: false });

        if (bookingsError) throw bookingsError;
        setBookings(bookingsData || []);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = bookings
    .filter(b => b.status === "confirmed")
    .reduce((sum, b) => sum + Number(b.total_amount), 0);

  const upcomingBookings = bookings.filter(
    b => new Date(b.booking_date) >= new Date() && b.status !== "cancelled"
  );

  if (authLoading || loading || !userRole) {
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
          <h1 className="text-3xl font-bold mb-2">Owner Dashboard</h1>
          <p className="text-muted-foreground">Manage your facilities and bookings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Facilities</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{facilities.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bookings.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingBookings.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="facilities">
          <TabsList>
            <TabsTrigger value="facilities">My Facilities</TabsTrigger>
            <TabsTrigger value="bookings">All Bookings</TabsTrigger>
          </TabsList>

          <TabsContent value="facilities" className="space-y-4 mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Your Facilities</h2>
              <Button onClick={() => navigate("/owner/add-facility")}>
                <Plus className="h-4 w-4 mr-2" />
                Add Facility
              </Button>
            </div>

            {facilities.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No facilities yet</p>
                  <Button onClick={() => navigate("/owner/add-facility")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Facility
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {facilities.map((facility) => (
                  <Card key={facility.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle>{facility.name}</CardTitle>
                        <Badge
                          variant={facility.status === "approved" ? "default" : "secondary"}
                        >
                          {facility.status}
                        </Badge>
                      </div>
                      <CardDescription>{facility.city}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1">
                          {facility.sports.slice(0, 3).map((sport) => (
                            <Badge key={sport} variant="outline" className="text-xs">
                              {sport}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          ₹{facility.base_price_per_hour}/hour
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => navigate(`/owner/facility/${facility.id}`)}
                        >
                          Manage
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="bookings" className="space-y-4 mt-6">
            <h2 className="text-xl font-semibold mb-4">All Bookings</h2>
            {bookings.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground">No bookings yet</p>
                </CardContent>
              </Card>
            ) : (
              bookings.map((booking) => (
                <Card key={booking.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{booking.user.full_name}</CardTitle>
                        <CardDescription>{booking.user.email}</CardDescription>
                      </div>
                      <Badge
                        variant={
                          booking.status === "confirmed"
                            ? "default"
                            : booking.status === "pending"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {booking.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Date</p>
                        <p className="font-medium">
                          {new Date(booking.booking_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Time</p>
                        <p className="font-medium">
                          {booking.start_time} - {booking.end_time}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Amount</p>
                        <p className="font-medium">₹{booking.total_amount}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default OwnerDashboard;
