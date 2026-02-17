import curriculumData from './curricular.json';

// Map chapter numbers to lesson names (from db.py)
const chapterToLesson = {
  4: "Goals and objectives",
  5: "Trading structure",
  6: "Trading tools",
  7: "Trading style",
  8: "Trading instruments",
  9: "Indicators",
  10: "Moving averages",
  11: "MACD histogram",
  12: "Average true range",
  13: "Volume",
  14: "Risk and money management",
  15: "Stop losses",
  16: "Market exposure guidelines",
  17: "The trading system",
  18: "The entry",
  19: "Trade management and the exit",
  20: "Trading routine",
  21: "Trading performance and analysis",
  22: "Contingency plans",
  23: "Personal rules"
};

// Module structure matching backend
export const CURRICULUM_MODULES = [
  {
    id: "foundations",
    title: "Foundations",
    description: "Essential concepts for every trader.",
    icon: "BookOpen",
    duration: "Approx. 1.5 hrs",
    lessons: ["Goals and objectives", "Trading structure", "Trading tools"]
  },
  {
    id: "methodology",
    title: "Methodology",
    description: "Develop your unique trading approach.",
    icon: "Shield",
    duration: "Approx. 1 hr",
    lessons: ["Trading style", "Trading instruments"]
  },
  {
    id: "indicators",
    title: "Indicators",
    description: "Tools to analyze market movements.",
    icon: "BookOpen",
    duration: "Approx. 2 hrs",
    lessons: ["Indicators", "Moving averages", "MACD histogram", "Average true range", "Volume"]
  },
  {
    id: "risk_management",
    title: "Risk Management",
    description: "Protect your capital and manage exposure.",
    icon: "BookOpen",
    duration: "Approx. 1.5 hrs",
    lessons: ["Risk and money management", "Stop losses", "Market exposure guidelines"]
  },
  {
    id: "system_development",
    title: "System Development",
    description: "Build and refine your trading system.",
    icon: "BookOpen",
    duration: "Approx. 1.5 hrs",
    lessons: ["The trading system", "The entry", "Trade management and the exit", "Trading routine"]
  },
  {
    id: "analysis_backup",
    title: "Analysis & Backup",
    description: "Review, adapt, and plan for contingencies.",
    icon: "BookOpen",
    duration: "Approx. 1.5 hrs",
    lessons: ["Trading performance and analysis", "Contingency plans", "Personal rules"]
  }
];

// Create a lookup map: lessonName -> { content, flashcards, keyPoints }
export const LESSON_CONTENTS = {};

curriculumData.items.forEach(item => {
  const chapterNum = item.chapter.number;
  const lessonName = chapterToLesson[chapterNum];
  
  if (lessonName) {
    // Convert content array to HTML paragraphs
    const contentHtml = item.lesson.content
      .map(para => `<p>${para}</p>`)
      .join('');
    
    LESSON_CONTENTS[lessonName] = {
      title: lessonName,
      content: contentHtml,
      flashcards: item.flashcards,
      keyPoints: item.key_points
    };
  }
});
