export async function saveToGoogleSheets(data) {
  try {
    const url = process.env.REACT_APP_PATIENT_RECORD_APP_URL;

    const payload = {
      mode: "prelim",
      ...data
    };

    const response = await fetch(url, {
      method: "POST",
      // 🚨 NO HEADERS → NO PREFLIGHT
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Request failed");
    }

    return await response.json();
  } catch (err) {
    console.error("SAVE ERROR:", err);
    throw err;
  }
}
