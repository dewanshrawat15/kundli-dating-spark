import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useProfileStore } from "@/store/profileStore";
import { toast } from "@/hooks/use-toast";

const AccountSettings = () => {
  const navigate = useNavigate();
  const { signOut } = useAuthStore();
  const { profile, updateProfile, isLoading } = useProfileStore();

  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    sexual_orientation: "",
    dating_preference: "",
    current_city: "",
    religion: "",
    min_age_preference: "",
    max_age_preference: "",
    max_distance_km: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        bio: profile.bio || "",
        sexual_orientation: profile.sexual_orientation || "",
        dating_preference: profile.dating_preference || "",
        current_city: profile.current_city || "",
        religion: profile.religion || "",
        min_age_preference: String(profile.min_age_preference || 22),
        max_age_preference: String(profile.max_age_preference || 35),
        max_distance_km: String(profile.max_distance_km || 200),
      });
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      await updateProfile({
        name: formData.name,
        bio: formData.bio,
        sexual_orientation: formData.sexual_orientation,
        dating_preference: formData.dating_preference,
        current_city: formData.current_city,
        religion: formData.religion || undefined,
        min_age_preference: parseInt(formData.min_age_preference, 10),
        max_age_preference: parseInt(formData.max_age_preference, 10),
        max_distance_km: parseInt(formData.max_distance_km, 10),
      });
      toast({ title: "Settings saved!" });
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    }
  };

  const set = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 pb-8">
      <div className="max-w-md mx-auto px-4">
        <div className="flex items-center gap-4 py-6">
          <Button onClick={() => navigate("/profile")} variant="ghost" size="sm" className="text-white hover:bg-white/20">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-white flex-1">Account Settings</h1>
        </div>

        <Card className="bg-white/10 backdrop-blur border-white/20 text-white mb-4">
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label className="text-white/80">Name</Label>
              <Input value={formData.name} onChange={(e) => set("name", e.target.value)}
                className="bg-white/10 border-white/20 text-white" />
            </div>
            <div className="space-y-1">
              <Label className="text-white/80">Bio</Label>
              <Textarea value={formData.bio} onChange={(e) => set("bio", e.target.value)}
                className="bg-white/10 border-white/20 text-white resize-none" rows={3} />
            </div>
            <div className="space-y-1">
              <Label className="text-white/80">Current City</Label>
              <Input value={formData.current_city} onChange={(e) => set("current_city", e.target.value)}
                className="bg-white/10 border-white/20 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur border-white/20 text-white mb-4">
          <CardHeader>
            <CardTitle className="text-base">Match Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label className="text-white/80">I'm interested in</Label>
              <Select value={formData.dating_preference} onValueChange={(v) => set("dating_preference", v)}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["men", "women", "everyone"].map((v) => (
                    <SelectItem key={v} value={v} className="capitalize">{v.charAt(0).toUpperCase() + v.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-white/80">Religion preference</Label>
              <Select value={formData.religion} onValueChange={(v) => set("religion", v)}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Any religion" />
                </SelectTrigger>
                <SelectContent>
                  {["hindu", "muslim", "sikh", "christian", "jain", "buddhist", "other"].map((v) => (
                    <SelectItem key={v} value={v} className="capitalize">{v.charAt(0).toUpperCase() + v.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-white/80 text-sm">Min Age</Label>
                <Input type="number" min={18} max={80} value={formData.min_age_preference}
                  onChange={(e) => set("min_age_preference", e.target.value)}
                  className="bg-white/10 border-white/20 text-white" />
              </div>
              <div className="space-y-1">
                <Label className="text-white/80 text-sm">Max Age</Label>
                <Input type="number" min={18} max={80} value={formData.max_age_preference}
                  onChange={(e) => set("max_age_preference", e.target.value)}
                  className="bg-white/10 border-white/20 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Button
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            onClick={handleSave}
            disabled={isLoading}
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
          <Button
            variant="ghost"
            className="w-full text-red-400 hover:text-red-300 hover:bg-red-400/10 border border-red-400/30"
            onClick={() => signOut().then(() => navigate("/"))}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
