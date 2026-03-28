import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Settings, MapPin, Heart, Calendar, Clock, Star } from "lucide-react";
import { useProfileStore } from "@/store/profileStore";
import { uploadPhoto, deletePhoto } from "@/api/profile";
import { toast } from "@/hooks/use-toast";

const Profile = () => {
  const navigate = useNavigate();
  const { profile, fetchProfile, setProfile } = useProfileStore();

  useEffect(() => {
    if (!profile) fetchProfile();
  }, []);

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white">Loading profile...</div>
      </div>
    );
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { data: img } = await uploadPhoto(file);
      setProfile({ ...profile, images: [...(profile.images || []), img] });
      toast({ title: "Photo uploaded!" });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    }
  };

  const handlePhotoDelete = async (id: string) => {
    try {
      await deletePhoto(id);
      setProfile({ ...profile, images: profile.images.filter((i) => i.id !== id) });
      toast({ title: "Photo removed" });
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 pb-8">
      <div className="max-w-md mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 py-6">
          <Button onClick={() => navigate("/home")} variant="ghost" size="sm" className="text-white hover:bg-white/20">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-white flex-1">My Profile</h1>
          <Button onClick={() => navigate("/account-settings")} variant="ghost" size="sm" className="text-white hover:bg-white/20">
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        {/* Photos */}
        <Card className="bg-white/10 backdrop-blur border-white/20 mb-4">
          <CardHeader>
            <CardTitle className="text-white text-base">Photos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {profile.images?.map((img) => (
                <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden bg-white/10 group">
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                  {img.is_primary && (
                    <span className="absolute top-1 left-1 bg-pink-500 text-white text-xs px-1.5 py-0.5 rounded">
                      Main
                    </span>
                  )}
                  <button
                    onClick={() => handlePhotoDelete(img.id)}
                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <label className="aspect-square rounded-lg border-2 border-dashed border-white/30 flex items-center justify-center cursor-pointer hover:border-white/60 transition-colors">
                <span className="text-white/50 text-3xl">+</span>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card className="bg-white/10 backdrop-blur border-white/20 mb-4">
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white text-xl font-bold">{profile.name}</h2>
                <p className="text-white/60">{profile.age} years old</p>
              </div>
              {profile.religion && (
                <Badge className="bg-white/20 text-white border-white/20 capitalize">
                  {profile.religion}
                </Badge>
              )}
            </div>
            {profile.bio && <p className="text-white/80 text-sm">{profile.bio}</p>}

            <div className="grid grid-cols-2 gap-2 text-sm text-white/60">
              {profile.current_city && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {profile.current_city}
                </div>
              )}
              {profile.marital_status && (
                <div className="flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5" />
                  {profile.marital_status.replace("_", " ")}
                </div>
              )}
              {profile.mother_tongue && (
                <div className="flex items-center gap-1">
                  <span>🗣</span> {profile.mother_tongue}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Birth details */}
        <Card className="bg-white/10 backdrop-blur border-white/20 mb-4">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400" />
              Birth Details (for Kundli)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-white/80">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-white/40" />
              <span>{profile.date_of_birth}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-white/40" />
              <span>{profile.time_of_birth}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-white/40" />
              <span>{profile.place_of_birth}</span>
            </div>
          </CardContent>
        </Card>

        <Button
          className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
          onClick={() => navigate("/home")}
        >
          View My Matches
        </Button>
      </div>
    </div>
  );
};

export default Profile;
