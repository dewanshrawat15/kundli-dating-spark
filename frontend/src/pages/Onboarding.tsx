import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/store/authStore";
import { useProfileStore } from "@/store/profileStore";
import { toast } from "@/hooks/use-toast";
import { Calendar, Clock, MapPin, Heart, User, BookUser } from "lucide-react";

const STEPS = ["Basic Info", "Birth Details", "Identity", "Preferences"];

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { setOnboardingComplete } = useAuthStore();
  const { completeOnboarding } = useProfileStore();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    date_of_birth: "",
    time_of_birth: "",
    place_of_birth: "",
    bio: "",
    sexual_orientation: "",
    dating_preference: "",
    religion: "",
    caste: "",
    mother_tongue: "",
    marital_status: "",
    min_age_preference: "22",
    max_age_preference: "35",
    max_distance_km: "200",
    current_city: "",
  });

  const set = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const canProceed = () => {
    if (step === 1) return formData.name.trim().length > 0;
    if (step === 2)
      return formData.date_of_birth && formData.time_of_birth && formData.place_of_birth;
    if (step === 3) return formData.sexual_orientation && formData.dating_preference;
    return true;
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      await completeOnboarding({
        name: formData.name,
        date_of_birth: formData.date_of_birth,
        time_of_birth: formData.time_of_birth,
        place_of_birth: formData.place_of_birth,
        bio: formData.bio,
        sexual_orientation: formData.sexual_orientation,
        dating_preference: formData.dating_preference,
        religion: formData.religion || undefined,
        caste: formData.caste || undefined,
        mother_tongue: formData.mother_tongue || undefined,
        marital_status: formData.marital_status || undefined,
        min_age_preference: parseInt(formData.min_age_preference, 10),
        max_age_preference: parseInt(formData.max_age_preference, 10),
        max_distance_km: parseInt(formData.max_distance_km, 10),
        current_city: formData.current_city || undefined,
      });
      setOnboardingComplete();
      toast({ title: "Profile complete!", description: "Finding your Kundli matches..." });
      navigate("/home");
    } catch (err: any) {
      const msg =
        err.response?.data
          ? Object.values(err.response.data).flat().join(" ")
          : "Failed to save profile. Please try again.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-white/10 backdrop-blur border-white/20 text-white">
        <CardHeader>
          {/* Step indicator */}
          <div className="flex gap-1 mb-2">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i + 1 <= step ? "bg-pink-500" : "bg-white/20"
                }`}
              />
            ))}
          </div>
          <CardTitle className="text-white">
            {step === 1 && <><User className="inline w-5 h-5 mr-2" />Basic Info</>}
            {step === 2 && <><Calendar className="inline w-5 h-5 mr-2" />Birth Details</>}
            {step === 3 && <><Heart className="inline w-5 h-5 mr-2" />Identity & Preferences</>}
            {step === 4 && <><BookUser className="inline w-5 h-5 mr-2" />Matrimonial Details</>}
          </CardTitle>
          <p className="text-white/60 text-sm">Step {step} of {STEPS.length}</p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Step 1: Basic */}
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label className="text-white">Full Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Your name"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Bio</Label>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => set("bio", e.target.value)}
                  placeholder="Tell potential matches a little about yourself..."
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 resize-none"
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">
                  <MapPin className="inline w-4 h-4 mr-1" />
                  Current City
                </Label>
                <Input
                  value={formData.current_city}
                  onChange={(e) => set("current_city", e.target.value)}
                  placeholder="Delhi, Mumbai..."
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
              </div>
            </>
          )}

          {/* Step 2: Birth details */}
          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label className="text-white">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  Date of Birth *
                </Label>
                <Input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => set("date_of_birth", e.target.value)}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">
                  <Clock className="inline w-4 h-4 mr-1" />
                  Time of Birth *
                </Label>
                <Input
                  type="time"
                  value={formData.time_of_birth}
                  onChange={(e) => set("time_of_birth", e.target.value)}
                  className="bg-white/10 border-white/20 text-white"
                />
                <p className="text-white/50 text-xs">
                  Exact birth time is critical for accurate Kundli computation
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-white">
                  <MapPin className="inline w-4 h-4 mr-1" />
                  Place of Birth *
                </Label>
                <Input
                  value={formData.place_of_birth}
                  onChange={(e) => set("place_of_birth", e.target.value)}
                  placeholder="City, State, Country"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
              </div>
            </>
          )}

          {/* Step 3: Identity */}
          {step === 3 && (
            <>
              <div className="space-y-2">
                <Label className="text-white">Sexual Orientation *</Label>
                <Select
                  value={formData.sexual_orientation}
                  onValueChange={(v) => set("sexual_orientation", v)}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {["straight", "lesbian", "gay", "bisexual", "pansexual", "other"].map((v) => (
                      <SelectItem key={v} value={v} className="capitalize">
                        {v.charAt(0).toUpperCase() + v.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-white">I'm interested in *</Label>
                <Select
                  value={formData.dating_preference}
                  onValueChange={(v) => set("dating_preference", v)}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {["men", "women", "everyone"].map((v) => (
                      <SelectItem key={v} value={v} className="capitalize">
                        {v.charAt(0).toUpperCase() + v.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-white">Marital Status</Label>
                <Select
                  value={formData.marital_status}
                  onValueChange={(v) => set("marital_status", v)}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never_married">Never Married</SelectItem>
                    <SelectItem value="divorced">Divorced</SelectItem>
                    <SelectItem value="widowed">Widowed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Step 4: Matrimonial details */}
          {step === 4 && (
            <>
              <div className="space-y-2">
                <Label className="text-white">Religion</Label>
                <Select value={formData.religion} onValueChange={(v) => set("religion", v)}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {["hindu", "muslim", "sikh", "christian", "jain", "buddhist", "other"].map((v) => (
                      <SelectItem key={v} value={v} className="capitalize">
                        {v.charAt(0).toUpperCase() + v.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-white">Caste / Sub-community</Label>
                <Input
                  value={formData.caste}
                  onChange={(e) => set("caste", e.target.value)}
                  placeholder="Optional"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Mother Tongue</Label>
                <Input
                  value={formData.mother_tongue}
                  onChange={(e) => set("mother_tongue", e.target.value)}
                  placeholder="Hindi, Tamil, Bengali..."
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-white text-sm">Min Age Preference</Label>
                  <Input
                    type="number"
                    min={18}
                    max={80}
                    value={formData.min_age_preference}
                    onChange={(e) => set("min_age_preference", e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white text-sm">Max Age Preference</Label>
                  <Input
                    type="number"
                    min={18}
                    max={80}
                    value={formData.max_age_preference}
                    onChange={(e) => set("max_age_preference", e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
              </div>
            </>
          )}

          {/* Navigation */}
          <div className="flex gap-3 pt-2">
            {step > 1 && (
              <Button
                variant="ghost"
                className="flex-1 text-white border border-white/20"
                onClick={() => setStep((s) => s - 1)}
              >
                Back
              </Button>
            )}
            {step < STEPS.length ? (
              <Button
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                disabled={!canProceed()}
                onClick={() => setStep((s) => s + 1)}
              >
                Continue
              </Button>
            ) : (
              <Button
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                disabled={loading}
                onClick={handleFinish}
              >
                {loading ? "Saving..." : "Find My Matches ✨"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
