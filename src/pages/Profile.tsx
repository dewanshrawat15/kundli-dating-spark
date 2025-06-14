import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit, LogOut, Star, Settings } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useProfileStore } from "@/store/profileStore";

const Profile = () => {
  const navigate = useNavigate();
  const { signOut } = useAuthStore();
  const { profile } = useProfileStore();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Mock profile data for demo
  const profileData = {
    name: "John Doe",
    age: 29,
    bio: "Software developer who believes in the power of the cosmos",
    location: "San Francisco, CA",
    dateOfBirth: "1994-06-15",
    timeOfBirth: "14:30",
    placeOfBirth: "New York, NY",
    sexualOrientation: "Straight",
    datingPreference: "Women",
    totalMatches: 12,
    successfulMatches: 3
  };

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
          <h1 className="text-2xl font-bold text-white">Profile</h1>
        </div>

        <Card className="bg-white/10 backdrop-blur border-white/20 mb-6">
          <CardContent className="p-6 text-center">
            <div className="w-24 h-24 bg-gradient-to-b from-pink-400/30 to-purple-600/30 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
              👤
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{profileData.name}, {profileData.age}</h2>
            <p className="text-purple-200 mb-4">{profileData.bio}</p>
            <p className="text-white/80 text-sm">📍 {profileData.location}</p>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur border-white/20 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-400" />
              Kundli Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-white">
              <span className="text-purple-200">Date of Birth:</span> {profileData.dateOfBirth}
            </div>
            <div className="text-white">
              <span className="text-purple-200">Time of Birth:</span> {profileData.timeOfBirth}
            </div>
            <div className="text-white">
              <span className="text-purple-200">Place of Birth:</span> {profileData.placeOfBirth}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur border-white/20 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-white">
              <span className="text-purple-200">Sexual Orientation:</span> {profileData.sexualOrientation}
            </div>
            <div className="text-white">
              <span className="text-purple-200">Looking for:</span> {profileData.datingPreference}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur border-white/20 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Match Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-white">
              <span className="text-purple-200">Total Matches:</span> {profileData.totalMatches}
            </div>
            <div className="text-white">
              <span className="text-purple-200">Successful Connections:</span> {profileData.successfulMatches}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Button
            onClick={() => navigate("/account-settings")}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
          >
            <Settings className="h-4 w-4 mr-2" />
            Account Settings
          </Button>
          
          <Button
            onClick={() => navigate("/onboarding")}
            variant="outline"
            className="w-full border-purple-400 text-purple-300 hover:bg-purple-400 hover:text-white"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile Details
          </Button>
          
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full border-red-400 text-red-400 hover:bg-red-400 hover:text-white"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
