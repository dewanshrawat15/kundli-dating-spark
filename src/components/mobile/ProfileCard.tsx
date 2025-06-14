
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faStar, faUser } from '@fortawesome/free-solid-svg-icons';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface ProfileCardProps {
  profile: {
    name: string;
    age: number;
    currentCity: string;
    sexualOrientation: string;
    datingPreference: string;
    bio: string;
    compatibilityScore: number;
    compatibilityDescription: string;
    profile_images?: string[];
  };
}

const ProfileCard = ({ profile }: ProfileCardProps) => {
  const primaryImage = profile.profile_images?.[0];

  return (
    <Card className="bg-white/95 backdrop-blur border-white/20 overflow-hidden shadow-xl mx-4">
      <div className="h-80 bg-gradient-to-b from-pink-400/30 to-purple-600/30 flex items-center justify-center">
        {primaryImage ? (
          <img 
            src={primaryImage} 
            alt={profile.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Avatar className="w-32 h-32">
            <AvatarFallback className="bg-gradient-to-b from-pink-400/30 to-purple-600/30">
              <FontAwesomeIcon icon={faUser} className="h-16 w-16 text-white" />
            </AvatarFallback>
          </Avatar>
        )}
      </div>
      <CardContent className="p-4">
        <div className="text-gray-800">
          <h2 className="text-2xl font-bold mb-2 text-gray-900">
            {profile.name}, {profile.age}
          </h2>
          
          <div className="flex items-center gap-2 mb-3 text-gray-600">
            <FontAwesomeIcon icon={faMapMarkerAlt} className="h-4 w-4" />
            <span className="text-sm">{profile.currentCity}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
            <div className="bg-blue-100 rounded-lg p-2 text-center border border-blue-200">
              <div className="font-medium text-blue-800">Orientation</div>
              <div className="text-blue-600 capitalize">{profile.sexualOrientation}</div>
            </div>
            <div className="bg-green-100 rounded-lg p-2 text-center border border-green-200">
              <div className="font-medium text-green-800">Looking for</div>
              <div className="text-green-600 capitalize">{profile.datingPreference}</div>
            </div>
          </div>

          <p className="text-gray-700 mb-4 text-sm leading-relaxed">{profile.bio}</p>
          
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center gap-2 mb-3">
              <FontAwesomeIcon icon={faStar} className="h-6 w-6 text-yellow-500" />
              <div>
                <span className="text-gray-900 font-bold text-lg">
                  Compatibility: {profile.compatibilityScore}/100
                </span>
                <div className="text-xs text-purple-600">Astrological Analysis</div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${profile.compatibilityScore}%` }}
              />
            </div>
            <p className="text-gray-700 text-sm leading-relaxed">
              {profile.compatibilityDescription}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileCard;
