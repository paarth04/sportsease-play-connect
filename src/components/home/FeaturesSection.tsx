import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Calendar, 
  Users, 
  Star,
  Wallet,
  Brain,
  Trophy,
  Zap,
  Shield,
  Clock
} from "lucide-react";

const features = [
  {
    icon: MapPin,
    title: "Smart Location Search",
    description: "Find facilities near you with advanced filters for sport type, price, and availability.",
    color: "bg-primary",
    badge: "Popular"
  },
  {
    icon: Brain,
    title: "AI Player Matching",
    description: "Get matched with players of similar skill levels for the perfect game experience.",
    color: "bg-accent",
    badge: "AI Powered"
  },
  {
    icon: Calendar,
    title: "Real-time Booking",
    description: "Book instantly with live availability updates and flexible scheduling options.",
    color: "bg-secondary",
    badge: "Instant"
  },
  {
    icon: Users,
    title: "Community Features",
    description: "Join teams, create tournaments, and connect with local sports enthusiasts.",
    color: "bg-primary",
    badge: "Social"
  },
  {
    icon: Wallet,
    title: "Smart Pricing",
    description: "Dynamic pricing based on demand, with loyalty rewards and off-peak discounts.",
    color: "bg-accent",
    badge: "Save Money"
  },
  {
    icon: Shield,
    title: "Secure Payments",
    description: "Safe and secure payment processing with multiple payment options available.",
    color: "bg-secondary",
    badge: "Secure"
  }
];

const stats = [
  { icon: Trophy, label: "Sports Supported", value: "15+" },
  { icon: Clock, label: "Avg Response Time", value: "< 30s" },
  { icon: Star, label: "Customer Rating", value: "4.9/5" },
  { icon: Zap, label: "Booking Success", value: "99.7%" }
];

const FeaturesSection = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            Why Choose SportsEase
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-primary">
              Play Better
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From AI-powered matchmaking to smart pricing, we've built the most comprehensive 
            sports platform to enhance your playing experience.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card key={index} className="group hover:shadow-card transition-all duration-300 border-border/50 hover:border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className={`${feature.color} p-3 rounded-xl shadow-glow group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-foreground">{feature.title}</h3>
                        <Badge variant="outline" className="text-xs">
                          {feature.badge}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className="text-center group">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-primary shadow-glow mb-3 group-hover:scale-110 transition-transform duration-300">
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button size="lg" className="bg-gradient-primary text-white shadow-button hover:shadow-glow transition-all duration-300">
            <Zap className="mr-2 h-5 w-5" />
            Get Started Now
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;