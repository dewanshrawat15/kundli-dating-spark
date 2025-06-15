
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Settings, MapPin, Heart, User, Upload } from "lucide-react";
import { useProfileStore } from "@/store/profileStore";
import { useAuthStore } from "@/store/authStore";
import ProfileImageManager from "@/components/ProfileImageManager";

const Profile = () => {
  const navigate = useNavigate();
  const { profile } = useProfileStore();
  const { signOut } = useAuthStore();

  if (!profile) {
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
          
          <Card className="bg-white/10 backdrop-blur border-white/20 p-8 text-center">
            <h3 className="text-white text-lg mb-2">Loading profile...</h3>
          </Card>
        </div>
      </div>
    );
  }

  const age = new Date().getFullYear() - new Date(profile.dateOfBirth).getFullYear();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6 pt-8">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate("/home")}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold text-white">Your Profile</h1>
          </div>
          <Button
            onClick={() => navigate("/account-settings")}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-6">
          {/* Profile Image Manager */}
          <ProfileImageManager />

          {/* Basic Info */}
          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  {profile.name}, {age}
                </h2>
                <div className="flex items-center gap-2 text-purple-200">
                  <MapPin className="h-4 w-4" />
                  <span>{profile.currentCity || "Location not set"}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/20 rounded-lg p-3 text-center">
                  <div className="text-white/80 text-sm">Orientation</div>
                  <div className="text-white font-medium capitalize">
                    {profile.sexualOrientation}
                  </div>
                </div>
                <div className="bg-white/20 rounded-lg p-3 text-center">
                  <div className="text-white/80 text-sm">Looking for</div>
                  <div className="text-white font-medium capitalize">
                    {profile.datingPreference}
                  </div>
                </div>
              </div>

              {profile.bio && (
                <div className="bg-white/20 rounded-lg p-3">
                  <div className="text-white/80 text-sm mb-1">About me</div>
                  <p className="text-white text-sm leading-relaxed">{profile.bio}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Astrological Info */}
          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Astrological Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-3">
                <div className="bg-white/20 rounded-lg p-3">
                  <div className="text-white/80 text-sm">Birth Date</div>
                  <div className="text-white font-medium">
                    {new Date(profile.dateOfBirth).toLocaleDateString()}
                  </div>
                </div>
                <div className="bg-white/20 rounded-lg p-3">
                  <div className="text-white/80 text-sm">Birth Time</div>
                  <div className="text-white font-medium">{profile.timeOfBirth}</div>
                </div>
                <div className="bg-white/20 rounded-lg p-3">
                  <div className="text-white/80 text-sm">Birth Place</div>
                  <div className="text-white font-medium">{profile.placeOfBirth}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={() => navigate("/account-settings")}
              className="w-full bg-white text-black hover:bg-gray-100"
            >
              <Settings className="h-4 w-4 mr-2" />
              Account Settings
            </Button>
            
            <Button
              onClick={signOut}
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/10"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
