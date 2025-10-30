import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { 
  MapPin, 
  Calendar, 
  Users, 
  Star,
  Search,
  Zap
} from "lucide-react";

const HeroSection = () => {
  const { user } = useAuth();
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-hero" />
      
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 border-2 border-white rounded-full animate-pulse" />
        <div className="absolute top-3/4 right-1/4 w-24 h-24 border-2 border-white rounded-full animate-pulse delay-1000" />
        <div className="absolute bottom-1/4 left-1/3 w-16 h-16 border-2 border-white rounded-full animate-pulse delay-500" />
      </div>

      <div className="container relative z-10 text-center text-white px-4">
        {/* Badge */}
        <Badge className="mb-6 bg-white/20 text-white border-white/30 hover:bg-white/30 transition-colors">
          <Zap className="w-3 h-3 mr-1" />
          India's #1 Sports Platform
        </Badge>

        {/* Main Heading */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
          Discover. Book.{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-primary-glow">
            Play.
          </span>
        </h1>

        {/* Subheading */}
        <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
          Find and book the perfect sports facilities near you. Join the community, 
          connect with players, and elevate your game with SportsEase.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          {user ? (
            <>
              <Link to="/facilities">
                <Button 
                  size="lg" 
                  className="bg-white text-primary hover:bg-white/90 shadow-button group"
                >
                  <Search className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                  Explore Facilities
                </Button>
              </Link>
              <Link to="/facilities">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm"
                >
                  <Calendar className="mr-2 h-5 w-5" />
                  Quick Book
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/auth">
                <Button 
                  size="lg" 
                  className="bg-white text-primary hover:bg-white/90 shadow-button group"
                >
                  <Search className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                  Get Started
                </Button>
              </Link>
              <Link to="/auth">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm"
                >
                  <Calendar className="mr-2 h-5 w-5" />
                  Join Now
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold mb-1">500+</div>
            <div className="text-sm text-white/80 flex items-center justify-center">
              <MapPin className="w-3 h-3 mr-1" />
              Facilities
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold mb-1">10K+</div>
            <div className="text-sm text-white/80 flex items-center justify-center">
              <Users className="w-3 h-3 mr-1" />
              Active Users
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold mb-1">25K+</div>
            <div className="text-sm text-white/80 flex items-center justify-center">
              <Calendar className="w-3 h-3 mr-1" />
              Bookings Made
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold mb-1">4.8</div>
            <div className="text-sm text-white/80 flex items-center justify-center">
              <Star className="w-3 h-3 mr-1 fill-current" />
              User Rating
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;