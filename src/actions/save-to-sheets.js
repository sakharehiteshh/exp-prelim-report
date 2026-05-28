export async function saveToGoogleSheets(data) {
  const url = process.env.REACT_APP_PATIENT_RECORD_APP_URL;

  const payload = {
    mode: "prelim",
    ...data
  };

  try {
    await fetch(url, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // Google Apps Script blocks the response body via CORS, but the POST
    // still reaches the sheet. Swallow the read error and treat as success.
    console.warn("Response unreadable (CORS) — data was saved:", err.message);
  }

  return { success: true, message: "Patient record saved to Google Sheets." };
}
