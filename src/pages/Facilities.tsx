import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Search, MapPin, DollarSign, Users } from "lucide-react";
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
  status: string;
}

const Facilities = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSport, setSelectedSport] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<number[]>([0, 5000]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchFacilities();
  }, [selectedSport, selectedCity]);

  const fetchFacilities = async () => {
    try {
      let query = supabase
        .from("facilities")
        .select("*")
        .eq("status", "approved");

      if (selectedSport !== "all") {
        query = query.contains("sports", [selectedSport]);
      }

      if (selectedCity !== "all") {
        query = query.eq("city", selectedCity);
      }

      const { data, error } = await query;

      if (error) throw error;
      setFacilities(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load facilities",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredFacilities = facilities.filter((facility) => {
    const matchesSearch = facility.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      facility.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      facility.sports.some((sport) => sport.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesPrice = facility.base_price_per_hour >= priceRange[0] &&
      facility.base_price_per_hour <= priceRange[1];
    
    return matchesSearch && matchesPrice;
  });

  const uniqueCities = Array.from(new Set(facilities.map(f => f.city)));
  const allSports = Array.from(new Set(facilities.flatMap(f => f.sports)));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search facilities, sports, or locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedSport} onValueChange={setSelectedSport}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Sports" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sports</SelectItem>
                {allSports.map((sport) => (
                  <SelectItem key={sport} value={sport}>
                    {sport}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {uniqueCities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Price Range Filter */}
          <div className="flex flex-col gap-2 p-4 border rounded-lg bg-card">
            <label className="text-sm font-medium">
              Price Range: ₹{priceRange[0]} - ₹{priceRange[1]}/hr
            </label>
            <Slider
              value={priceRange}
              onValueChange={setPriceRange}
              min={0}
              max={5000}
              step={100}
              className="w-full"
            />
          </div>
        </div>

        {/* Facilities Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading facilities...</p>
          </div>
        ) : filteredFacilities.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No facilities found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFacilities.map((facility) => (
              <Card
                key={facility.id}
                className="overflow-hidden hover:shadow-card transition-shadow cursor-pointer"
                onClick={() => navigate(`/facilities/${facility.id}`)}
              >
                <div className="h-48 bg-muted relative overflow-hidden">
                  {facility.images && facility.images.length > 0 ? (
                    <img
                      src={facility.images[0]}
                      alt={facility.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MapPin className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{facility.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {facility.city}, {facility.state}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {facility.sports.slice(0, 3).map((sport) => (
                        <Badge key={sport} variant="secondary">
                          {sport}
                        </Badge>
                      ))}
                      {facility.sports.length > 3 && (
                        <Badge variant="outline">+{facility.sports.length - 3}</Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        <span>₹{facility.base_price_per_hour}/hr</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{facility.capacity} capacity</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Facilities;
