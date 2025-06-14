
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, MessageCircle, Star } from "lucide-react";

const Matches = () => {
  const navigate = useNavigate();

  const matches = [
    {
      id: "1",
      name: "Sarah Johnson",
      age: 28,
      matchScore: 85,
      bio: "Yoga instructor who loves stargazing",
      lastMessage: "Hi! I love your interest in astrology 🌟",
      timeAgo: "2h ago"
    },
    {
      id: "2", 
      name: "Emily Chen",
      age: 26,
      matchScore: 92,
      bio: "Artist and spiritual seeker",
      lastMessage: "Your Kundli compatibility is amazing!",
      timeAgo: "1d ago"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-4 mb-6 pt-8">
          <Button
            onClick={() => navigate("/home")}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-white">Your Matches</h1>
        </div>

        <div className="space-y-4">
          {matches.map((match) => (
            <Card key={match.id} className="bg-white/10 backdrop-blur border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-b from-pink-400/30 to-purple-600/30 rounded-full flex items-center justify-center text-2xl">
                    👤
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-semibold">{match.name}, {match.age}</h3>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400" />
                        <span className="text-yellow-400 text-sm">{match.matchScore}%</span>
                      </div>
                    </div>
                    <p className="text-purple-200 text-sm mb-2">{match.bio}</p>
                    {match.lastMessage && (
                      <div className="text-white/80 text-sm">
                        <span className="font-medium">Latest: </span>
                        {match.lastMessage}
                        <span className="text-purple-300 ml-2">• {match.timeAgo}</span>
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => navigate(`/chat/${match.id}`)}
                    size="sm"
                    className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {matches.length === 0 && (
            <Card className="bg-white/10 backdrop-blur border-white/20 p-8 text-center">
              <Star className="h-12 w-12 mx-auto mb-4 text-yellow-400" />
              <h3 className="text-white text-lg mb-2">No matches yet</h3>
              <p className="text-purple-200">Keep swiping to find your cosmic connection!</p>
              <Button 
                onClick={() => navigate("/home")}
                className="mt-4 bg-gradient-to-r from-pink-500 to-purple-600"
              >
                Continue Discovering
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Matches;
