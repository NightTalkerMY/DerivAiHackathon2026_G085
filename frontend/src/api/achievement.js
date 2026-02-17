export function fetchAchievements() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        currentXP: 250,
        streakDays: 7,
        lessonsCompleted: 2,
        tradesAnalyzed: 0,

        achievements: [
          {
            id: "first-steps",
            title: "First Steps",
            description: "Complete your first lesson",
            icon: "BookOpen",
            earned: true,
            earnedDate: "Jan 10, 2024",
            xp: 50,
            rarity: "common",
          },
          {
            id: "trade-analyst",
            title: "Trade Analyst",
            description: "Analyze your first trade",
            icon: "TrendingUp",
            earned: true,
            earnedDate: "Jan 12, 2024",
            xp: 75,
            rarity: "common",
          },
          {
            id: "week-warrior",
            title: "Week Warrior",
            description: "Maintain a 7-day learning streak",
            icon: "Flame",
            earned: true,
            earnedDate: "Jan 17, 2024",
            xp: 100,
            rarity: "rare",
          },
          {
            id: "risk-master",
            title: "Risk Master",
            description: "Complete the Risk Management module",
            icon: "Shield",
            earned: false,
            progress: 3,
            maxProgress: 6,
            xp: 150,
            rarity: "rare",
          },
          {
            id: "pattern-spotter",
            title: "Pattern Spotter",
            description: "Identify 10 chart patterns",
            icon: "Target",
            earned: false,
            progress: 4,
            maxProgress: 10,
            xp: 200,
            rarity: "epic",
          },
        ],
      });
    }, 800);
  });
}
