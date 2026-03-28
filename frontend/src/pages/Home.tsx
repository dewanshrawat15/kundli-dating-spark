import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useMatches } from "@/hooks/useMatches";
import { useAuthStore } from "@/store/authStore";
import { Mail, Star, ChevronDown, LogOut } from "lucide-react";
import type { MatchItem } from "@/api/matches";

const ScoreColor = ({ score }: { score: number }) => {
  if (score >= 80) return <span className="text-green-400">{score.toFixed(0)}</span>;
  if (score >= 60) return <span className="text-yellow-400">{score.toFixed(0)}</span>;
  return <span className="text-orange-400">{score.toFixed(0)}</span>;
};

const MatchCard = ({
  match,
  onDecide,
}: {
  match: MatchItem;
  onDecide: (id: string, d: "accepted" | "rejected") => void;
}) => {
  const gunaPercent = Math.round((match.guna_milan_total / 36) * 100);

  return (
    <Card className="bg-white/10 backdrop-blur border-white/20 text-white overflow-hidden">
      <CardContent className="p-0">
        <div className="flex gap-4 p-4">
          {/* Photo */}
          <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-white/10">
            {match.primary_photo_url ? (
              <img
                src={match.primary_photo_url}
                alt={match.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl">🙂</div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-lg leading-tight">{match.name}</h3>
                <p className="text-white/60 text-sm">
                  {match.age} yrs · {match.city || "Unknown city"}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xl font-bold">
                  <ScoreColor score={match.overall_score} />
                  <span className="text-white/40 text-sm">/100</span>
                </div>
                <div className="text-white/50 text-xs">Overall</div>
              </div>
            </div>

            {/* Guna Milan bar */}
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs text-white/60">
                <span>Guna Milan</span>
                <span>
                  {match.guna_milan_total}/36
                  {!match.is_manglik_compatible && (
                    <span className="text-orange-400 ml-1">⚠ Manglik</span>
                  )}
                </span>
              </div>
              <Progress value={gunaPercent} className="h-1.5 bg-white/20" />
            </div>

            {match.bio_snippet && (
              <p className="mt-2 text-white/70 text-sm line-clamp-2">{match.bio_snippet}</p>
            )}
          </div>
        </div>

        {match.narrative && (
          <div className="px-4 pb-3">
            <p className="text-white/60 text-xs italic leading-relaxed line-clamp-3">
              "{match.narrative}"
            </p>
          </div>
        )}

        <div className="border-t border-white/10 px-4 py-3 flex items-center justify-between">
          <a
            href={`mailto:${match.email}`}
            className="flex items-center gap-1.5 text-blue-300 hover:text-blue-200 text-sm transition-colors"
          >
            <Mail className="w-4 h-4" />
            <span className="truncate max-w-[160px]">{match.email}</span>
          </a>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-3 text-red-400 hover:text-red-300 hover:bg-red-400/10"
              onClick={() => onDecide(match.profile_id, "rejected")}
            >
              Pass
            </Button>
            <Button
              size="sm"
              className="h-8 px-3 bg-green-600/80 hover:bg-green-600"
              onClick={() => onDecide(match.profile_id, "accepted")}
            >
              <Star className="w-3.5 h-3.5 mr-1" />
              Interest
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const { signOut } = useAuthStore();
  const { matches, loading, error, hasMore, totalUnseen, fetchMatches, recordDecision } =
    useMatches();

  useEffect(() => {
    fetchMatches(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/30 backdrop-blur border-b border-white/10 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-white font-bold text-xl">✨ Kundli Matches</h1>
            {totalUnseen > 0 && (
              <p className="text-white/60 text-xs">{totalUnseen} unseen matches</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white/70 hover:text-white"
              onClick={() => navigate("/profile")}
            >
              Profile
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white/70 hover:text-white"
              onClick={() => signOut().then(() => navigate("/"))}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {error && <div className="text-red-300 text-center py-4">{error}</div>}

        {!loading && matches.length === 0 && !error && (
          <div className="text-center py-16 text-white/60 space-y-3">
            <div className="text-5xl">🪐</div>
            <p className="text-lg font-medium text-white">No matches yet</p>
            <p className="text-sm">
              Your birth chart is being analyzed.
              <br />
              Check back shortly — matches appear once Kundli computation completes.
            </p>
          </div>
        )}

        {matches.map((match) => (
          <MatchCard key={match.profile_id} match={match} onDecide={recordDecision} />
        ))}

        {hasMore && !loading && (
          <Button
            variant="ghost"
            className="w-full text-white/70 hover:text-white border border-white/20"
            onClick={() => fetchMatches()}
          >
            <ChevronDown className="w-4 h-4 mr-2" />
            Load more matches
          </Button>
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
