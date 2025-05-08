const serverAddr = "http://localhost:5000";

// Make a direct request to backend
async function apiCheckOpenAnswer(text, question, answer) {
  const url = `${serverAddr}/check_open_answer`;
  const payload = { text, question, answer };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message ?? "Failed to fetch from backend.");
    }

    return response.json();
  } catch (error) {
    console.error("Error in apiCheckOpenAnswer:", error);
    throw error;
  }
}

// Prepare a request
export async function checkOpenAnswer(
  text: string,
  question: string,
  answer: string,
) {
  if (!text || !question) {
    throw new Error(
      "Missing required values: 'text' and 'question' are required.",
    );
  }

  const result = await apiCheckOpenAnswer(text, question, answer);
  return result;
}
