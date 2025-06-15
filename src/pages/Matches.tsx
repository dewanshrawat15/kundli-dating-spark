
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, MessageCircle, Star, RefreshCw } from "lucide-react";
import { useMatches } from "@/hooks/useMatches";

const Matches = () => {
  const navigate = useNavigate();
  const { matches, loading, error, refetch } = useMatches();

  const handleChatNavigation = (match: any) => {
    if (match.chatRoomId) {
      navigate(`/chat/${match.chatRoomId}`);
    } else {
      // Fallback to user ID if no chat room found
      navigate(`/chat/${match.id}`);
    }
  };

  if (loading) {
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
          
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
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
            <Button
              onClick={refetch}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 ml-auto"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          
          <Card className="bg-white/10 backdrop-blur border-white/20 p-8 text-center">
            <h3 className="text-white text-lg mb-2">Failed to load matches</h3>
            <p className="text-purple-200 mb-4">{error}</p>
            <Button 
              onClick={refetch}
              className="bg-gradient-to-r from-pink-500 to-purple-600"
            >
              Try Again
            </Button>
          </Card>
        </div>
      </div>
    );
  }

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
          <Button
            onClick={refetch}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20 ml-auto"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          {matches.map((match) => (
            <Card key={match.id} className="bg-white/10 backdrop-blur border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-b from-pink-400/30 to-purple-600/30 rounded-full flex items-center justify-center overflow-hidden">
                    {match.profileImages && match.profileImages.length > 0 ? (
                      <img 
                        src={match.profileImages[0]} 
                        alt={match.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">👤</span>
                    )}
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
                    onClick={() => handleChatNavigation(match)}
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
