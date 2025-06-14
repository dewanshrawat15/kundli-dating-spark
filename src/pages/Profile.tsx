
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faEdit, faSignOutAlt, faStar, faCog, faUser } from '@fortawesome/free-solid-svg-icons';
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

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const profileImage = profile?.profileImages?.[0];
  const age = profile?.dateOfBirth ? calculateAge(profile.dateOfBirth) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="flex items-center gap-4 p-4 text-white">
        <Button
          onClick={() => navigate("/home")}
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Profile</h1>
      </div>

      <div className="px-4 pb-8">
        <Card className="bg-white/10 backdrop-blur border-white/20 mb-6">
          <CardContent className="p-6 text-center">
            <Avatar className="w-24 h-24 mx-auto mb-4">
              {profileImage ? (
                <AvatarImage src={profileImage} alt="Profile" className="object-cover" />
              ) : (
                <AvatarFallback className="bg-gradient-to-b from-pink-400/30 to-purple-600/30">
                  <FontAwesomeIcon icon={faUser} className="h-12 w-12 text-white" />
                </AvatarFallback>
              )}
            </Avatar>
            <h2 className="text-2xl font-bold text-white mb-2">
              {profile?.name || 'User'}{age ? `, ${age}` : ''}
            </h2>
            <p className="text-purple-200 mb-4">{profile?.bio || 'No bio available'}</p>
            <p className="text-white/80 text-sm">📍 {profile?.current_city || 'Location not set'}</p>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur border-white/20 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FontAwesomeIcon icon={faStar} className="h-5 w-5 text-yellow-400" />
              Kundli Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-white">
              <span className="text-purple-200">Date of Birth:</span> {profile?.dateOfBirth || 'Not set'}
            </div>
            <div className="text-white">
              <span className="text-purple-200">Time of Birth:</span> {profile?.timeOfBirth || 'Not set'}
            </div>
            <div className="text-white">
              <span className="text-purple-200">Place of Birth:</span> {profile?.placeOfBirth || 'Not set'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur border-white/20 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-white">
              <span className="text-purple-200">Sexual Orientation:</span> {profile?.sexualOrientation || 'Not set'}
            </div>
            <div className="text-white">
              <span className="text-purple-200">Looking for:</span> {profile?.datingPreference || 'Not set'}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Button
            onClick={() => navigate("/account-settings")}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
          >
            <FontAwesomeIcon icon={faCog} className="h-4 w-4 mr-2" />
            Account Settings
          </Button>
          
          <Button
            onClick={() => navigate("/onboarding")}
            variant="outline"
            className="w-full border-purple-400 text-purple-300 hover:bg-purple-400 hover:text-white"
          >
            <FontAwesomeIcon icon={faEdit} className="h-4 w-4 mr-2" />
            Edit Profile Details
          </Button>
          
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full border-red-400 text-red-400 hover:bg-red-400 hover:text-white"
          >
            <FontAwesomeIcon icon={faSignOutAlt} className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
