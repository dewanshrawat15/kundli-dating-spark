
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, X, Star } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useProfileStore } from "@/store/profileStore";
import { toast } from "@/hooks/use-toast";

const Home = () => {
  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const { profile } = useProfileStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    if (profile && !profile.isOnboardingComplete) {
      navigate("/onboarding");
      return;
    }

    // Mock profile for demo
    setCurrentProfile({
      id: "demo-user",
      name: "Sarah Johnson",
      age: 28,
      bio: "Yoga instructor who loves stargazing and meditation",
      images: [],
      matchScore: 85,
      compatibility: "Your stars align beautifully! Both of you have strong Venus influences."
    });
    setLoading(false);
  }, [user, profile, navigate]);

  const handleLike = () => {
    toast({
      title: "It's a match! ⭐",
      description: "You and Sarah have matched based on your Kundli compatibility!",
    });
    // Load next profile
    setCurrentProfile(null);
    setTimeout(() => {
      setCurrentProfile({
        id: "demo-user-2",
        name: "Emily Chen",
        age: 26,
        bio: "Artist and spiritual seeker, loves exploring ancient wisdom",
        images: [],
        matchScore: 92,
        compatibility: "Exceptional compatibility! Your planetary alignments suggest a deep spiritual connection."
      });
    }, 1000);
  };

  const handlePass = () => {
    // Load next profile
    setCurrentProfile({
      id: "demo-user-3",
      name: "Jessica Williams",
      age: 30,
      bio: "Travel blogger who believes in destiny and cosmic connections",
      images: [],
      matchScore: 78,
      compatibility: "Good compatibility with potential for growth and understanding."
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Finding your cosmic matches...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-sm mx-auto pt-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Discover</h1>
          <Button 
            onClick={() => navigate("/matches")}
            variant="outline" 
            className="border-white/30 text-white hover:bg-white/20"
          >
            View Matches
          </Button>
        </div>

        {currentProfile ? (
          <Card className="bg-white/10 backdrop-blur border-white/20 overflow-hidden">
            <div className="h-96 bg-gradient-to-b from-pink-400/30 to-purple-600/30 flex items-center justify-center">
              <div className="text-6xl">👤</div>
            </div>
            <CardContent className="p-6">
              <div className="text-white">
                <h2 className="text-2xl font-bold mb-2">{currentProfile.name}, {currentProfile.age}</h2>
                <p className="text-purple-200 mb-4">{currentProfile.bio}</p>
                
                <div className="bg-white/10 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="h-5 w-5 text-yellow-400" />
                    <span className="text-white font-semibold">Match Score: {currentProfile.matchScore}%</span>
                  </div>
                  <p className="text-purple-200 text-sm">{currentProfile.compatibility}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white/10 backdrop-blur border-white/20 h-96 flex items-center justify-center">
            <div className="text-white text-center">
              <Star className="h-12 w-12 mx-auto mb-4 text-yellow-400" />
              <p>No more profiles for now</p>
              <p className="text-purple-200 text-sm">Check back later for new matches!</p>
            </div>
          </Card>
        )}

        <div className="flex justify-center gap-6 mt-6">
          <Button
            onClick={handlePass}
            size="lg"
            className="rounded-full w-16 h-16 bg-red-500 hover:bg-red-600"
            disabled={!currentProfile}
          >
            <X className="h-8 w-8" />
          </Button>
          <Button
            onClick={handleLike}
            size="lg"
            className="rounded-full w-16 h-16 bg-green-500 hover:bg-green-600"
            disabled={!currentProfile}
          >
            <Heart className="h-8 w-8" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Home;
