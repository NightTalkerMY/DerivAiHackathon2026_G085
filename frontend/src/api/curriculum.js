const API_BASE_URL = "http://localhost:8000"; 

export async function fetchCurriculumStatus(userId) {
  try {
    const response = await fetch(`${API_BASE_URL}/curriculum/status/${userId}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching curriculum status:", error);
    throw error;
  }
}

export async function markChapterComplete(userId, chapterName) {
  try {
    const response = await fetch(`${API_BASE_URL}/curriculum/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id: userId, chapter_id: chapterName }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return await response.json(); // This response includes new_competency and finished_chapters
  } catch (error) {
    console.error("Error marking chapter complete:", error);
    throw error;
  }
}

export async function askCurriculumConcept(userId, currentChapter, highlightedText) {
  try {
    const response = await fetch(`${API_BASE_URL}/curriculum/ask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        current_chapter: currentChapter,
        highlighted_text: highlightedText,
      }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return await response.json(); // This response includes explanation, related_context
  } catch (error) {
    console.error("Error asking curriculum concept:", error);
    throw error;
  }
}