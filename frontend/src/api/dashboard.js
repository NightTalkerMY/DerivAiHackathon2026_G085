const API_BASE_URL = "http://localhost:8000"

export async function fetchDashboard(userId = "william") {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/${userId}`);

    if (!response.ok){
      const errorData = await response.json();
      throw new Error(errorData.detail || `Http error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    throw error;
  }
}

export async function triggerInsightGeneration(userId = "william") {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/insight`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
        throw new Error("Failed to generate insight");
    }

    return await response.json(); // Returns { status: "success", insight: "..." }
  } catch (error) {
    console.error("Error generating insight:", error);
    throw error;
  }
}