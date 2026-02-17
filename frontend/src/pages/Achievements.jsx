import { useEffect, useState } from "react";
import { fetchAchievements } from "../api/achievement";
import {
  Trophy,
  Star,
  Target,
  Flame,
  BookOpen,
  TrendingUp,
  Shield,
  Lock,
} from "lucide-react";

/* ---------------- ICON MAP ---------------- */

const iconMap = {
  BookOpen,
  TrendingUp,
  Flame,
  Shield,
  Target,
};

/* ---------------- LEVEL DATA ---------------- */

const levels = [
  { level: 1, name: "Beginner Trader", minXP: 0 },
  { level: 2, name: "Aspiring Trader", minXP: 500 },
  { level: 3, name: "Intermediate Trader", minXP: 1000 },
  { level: 4, name: "Skilled Trader", minXP: 2000 },
];

/* ---------------- PAGE ---------------- */

export default function Achievements() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    fetchAchievements()
      .then(setData)
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, []);

  if (status === "loading") {
    return <div className="h-40 bg-slate-100 rounded-xl animate-pulse" />;
  }

  const {
    currentXP,
    streakDays,
    lessonsCompleted,
    tradesAnalyzed,
    achievements,
  } = data;

  const currentLevel =
    [...levels].reverse().find((l) => currentXP >= l.minXP) || levels[0];
  const nextLevel = levels.find((l) => l.minXP > currentXP);

  const progressPercent = nextLevel
    ? ((currentXP - currentLevel.minXP) /
        (nextLevel.minXP - currentLevel.minXP)) *
      100
    : 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Achievements</h1>
        <p className="text-slate-600 mt-1">
          Track your progress and earn rewards as you learn
        </p>
      </div>

      {/* Level Card */}
      <div className="rounded-xl p-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 bg-white/20 rounded-xl flex items-center justify-center">
              <Star />
            </div>
            <div>
              <p className="text-sm opacity-80">Current Level</p>
              <h2 className="text-xl font-bold">
                Level {currentLevel.level} • {currentLevel.name}
              </h2>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{currentXP} XP</p>
            {nextLevel && (
              <p className="text-sm opacity-80">
                {nextLevel.minXP - currentXP} XP to Level {nextLevel.level}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 h-3 bg-white/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-white"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Trophy} label="Badges Earned" value={achievements.filter(a => a.earned).length} />
        <Stat icon={Flame} label="Day Streak" value={streakDays} />
        <Stat icon={BookOpen} label="Lessons Done" value={lessonsCompleted} />
        <Stat icon={TrendingUp} label="Trades Analyzed" value={tradesAnalyzed} />
      </div>

      {/* Achievements */}
      <div>
        <h2 className="text-lg font-semibold mb-4">All Achievements</h2>
        <div className="grid lg:grid-cols-2 gap-4">
          {achievements.map((a) => (
            <AchievementCard key={a.id} achievement={a} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- COMPONENTS ---------------- */

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="bg-white border rounded-xl p-4 text-center">
      <Icon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-slate-600">{label}</p>
    </div>
  );
}

function AchievementCard({ achievement }) {
  const Icon = iconMap[achievement.icon];

  return (
    <div
      className={`border rounded-xl p-4 flex gap-4 ${
        achievement.earned ? "bg-white" : "opacity-60"
      }`}
    >
      <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
        {achievement.earned ? (
          <Icon className="text-blue-600" />
        ) : (
          <Lock className="text-slate-400" />
        )}
      </div>

      <div className="flex-1">
        <h3 className="font-semibold">{achievement.title}</h3>
        <p className="text-sm text-slate-600">
          {achievement.description}
        </p>

        {achievement.earned ? (
          <p className="text-xs text-slate-500 mt-1">
            Earned on {achievement.earnedDate}
          </p>
        ) : achievement.progress !== undefined ? (
          <div className="mt-2">
            <div className="flex justify-between text-xs">
              <span>Progress</span>
              <span>
                {achievement.progress}/{achievement.maxProgress}
              </span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full mt-1">
              <div
                className="h-full bg-blue-600"
                style={{
                  width: `${
                    (achievement.progress / achievement.maxProgress) * 100
                  }%`,
                }}
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="text-sm text-blue-600 font-semibold">
        +{achievement.xp} XP
      </div>
    </div>
  );
}
