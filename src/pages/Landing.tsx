
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Star, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Star className="h-16 w-16 text-yellow-400 animate-pulse" />
              <Heart className="h-8 w-8 text-pink-400 absolute -top-2 -right-2 animate-bounce" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Kundli Dating
          </h1>
          <p className="text-xl text-purple-200 mb-8 max-w-2xl mx-auto">
            Find your perfect match through the ancient wisdom of Kundli compatibility. 
            Let the stars guide you to your soulmate.
          </p>
          <Button 
            onClick={() => navigate("/auth")}
            size="lg" 
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-4 text-lg"
          >
            Start Your Journey
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="bg-white/10 backdrop-blur border-white/20 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400" />
                Kundli Matching
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-purple-200">
                Advanced AI analyzes your birth charts to find cosmic compatibility
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur border-white/20 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-400" />
                Meaningful Connections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-purple-200">
                Connect with people who share your cosmic energy and values
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur border-white/20 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-400" />
                Safe & Secure
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-purple-200">
                Your privacy and security are protected with modern technology
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Landing;
