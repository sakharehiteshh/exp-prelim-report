import jsPDF from "jspdf";

export function generatePDF(data) {
  const doc = new jsPDF({ format: "letter" });

  const pageWidth  = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin       = 18;
  const contentWidth = pageWidth - margin * 2;
  let yPos = 12;

  /* ---------------- HEADER ---------------- */
  const logo = require("../assets/expressheartcarelogo.png");
  doc.addImage(logo, "PNG", margin, yPos, 46, 15);

  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text("Express Heart Tests", margin + 68, yPos + 6);

  doc.setFontSize(8.5);
  doc.setFont(undefined, "normal");
  doc.text("Preliminary Cardiac Screening Report", margin + 68, yPos + 11);
  doc.text("(314) 557-2620 | expressheartcare@gmail.com", margin + 68, yPos + 16);

  yPos += 19;
  divider();

  /* ---------------- PATIENT INFORMATION ---------------- */
  section("Patient Information");
  row("Name",   data.patientName,  "Height", data.vitals?.height);
  row("DOB",    data.dateOfBirth,  "Weight", data.vitals?.weight ? `${data.vitals.weight} lbs` : "");
  row("Gender", data.gender,       "BMI",    data.vitals?.bmi);
  row("Age",    data.age);
  divider();

  /* ---------------- VITAL SIGNS ---------------- */
  section("Vital Signs");
  row("Blood Pressure", data.vitals?.bloodPressure, "Heart Rate", data.vitals?.heartRate ? `${data.vitals.heartRate} bpm` : "");
  row("Oxygen Saturation", data.vitals?.o2Level ? `${data.vitals.o2Level}%` : "");
  divider();

  /* ---------------- EKG ---------------- */
  section("Electrocardiogram (EKG)");
  doc.text(
    `Result: ${data.ekg?.status === "normal" ? "Normal" : "Needs Review"}`,
    pageWidth - margin - 52, yPos - 5
  );
  if (data.ekg?.rhythm) {
    const rhythmLabels = {
      "normal-sinus":       "Normal Sinus Rhythm",
      "sinus-tachy-brady":  "Sinus Tachy / Bradycardia",
      "afib-pvcs-other":    "AFib / PVCs / Other",
    };
    line(`Rhythm: ${rhythmLabels[data.ekg.rhythm] || data.ekg.rhythm}`);
  }
  if (data.ekg?.notes) {
    const ekgLines = doc.splitTextToSize(data.ekg.notes, contentWidth);
    doc.text(ekgLines, margin + 4, yPos);
    yPos += ekgLines.length * 4 + 1;
  }
  divider();

  /* ---------------- HEART SOUNDS ---------------- */
  section("Heart Sounds Examination");
  doc.text(
    `Result: ${data.heartSounds?.status === "normal" ? "Normal" : "Needs Review"}`,
    pageWidth - margin - 52, yPos - 5
  );
  if (data.heartSounds?.classification) {
    const classLabels = {
      "normal-no-murmur":  "Normal (No Murmur)",
      "innocent-murmur":   "Innocent Murmur",
      "structural-murmur": "Structural Murmur / Low EF",
    };
    line(`Classification: ${classLabels[data.heartSounds.classification] || data.heartSounds.classification}`);
  }
  if (data.heartSounds?.notes) {
    const hsLines = doc.splitTextToSize(data.heartSounds.notes, contentWidth);
    doc.text(hsLines, margin + 4, yPos);
    yPos += hsLines.length * 4 + 1;
  }
  divider();

  /* ---------------- FITNESS ---------------- */
  section("Fitness Assessment");
  doc.text(
    `Result: ${data.fitness?.status === "normal" ? "Normal" : "Needs Review"}`,
    pageWidth - margin - 52, yPos - 5
  );
  if (data.fitness?.notes) {
    const fitLines = doc.splitTextToSize(data.fitness.notes, contentWidth);
    doc.text(fitLines, margin + 4, yPos);
    yPos += fitLines.length * 4 + 1;
  }
  line(`30s Sit-to-Stand: ${data.fitness?.sitStandCount || "N/A"}   |   Est. VO2 Max: ${data.fitness?.vo2Max || "N/A"} ml/kg/min   |   Category: ${data.fitness?.fitnessCategory || "N/A"}`);
  divider();

  /* ---------------- CHOLESTEROL ---------------- */
  section("Finger Stick Cholesterol Test");
  row("Total Cholesterol", data.cholesterol?.total ? `${data.cholesterol.total} mg/dL` : "",
      "LDL", data.cholesterol?.ldl ? `${data.cholesterol.ldl} mg/dL` : "");
  row("HDL", data.cholesterol?.hdl ? `${data.cholesterol.hdl} mg/dL` : "",
      "Triglycerides", data.cholesterol?.triglycerides ? `${data.cholesterol.triglycerides} mg/dL` : "");
  row("Glucose", data.cholesterol?.glucose ? `${data.cholesterol.glucose} mg/dL` : "",
      "Status", data.cholesterol?.status === "normal" ? "Normal" : "Needs Review");
  if (data.cholesterol?.notes) {
    const cLines = doc.splitTextToSize(data.cholesterol.notes, contentWidth);
    doc.text(cLines, margin + 4, yPos);
    yPos += cLines.length * 4 + 1;
  }
  divider();

  /* ---------------- FRAMINGHAM RISK ---------------- */
  section("Framingham Risk Score");
  const fr = data.expressHeartScore?.framinghamRisk;
  if (fr !== null && fr !== undefined && fr !== "") {
    const frLabel = Number(fr) < 10 ? "Low Risk" : Number(fr) <= 20 ? "Intermediate Risk" : "High Risk";
    line(`10-Year CVD Risk: ${fr}%   |   ${frLabel}`);
  } else {
    line("10-Year CVD Risk: Not entered");
  }
  divider();

  /* ---------------- EXPRESS HEART SCORE ---------------- */
  section("Express Heart Score");
  const ehs = data.expressHeartScore;
  if (!ehs || ehs.total === null || ehs.total === undefined) {
    line("Score: Insufficient data — complete more assessment pillars");
  } else {
    line(`Total Score: ${ehs.total} / 100   |   Status: ${ehs.grade?.label || ""}`);
  }
  yPos += 2;

  // Grading scale table
  doc.setFontSize(8.5);
  doc.setFont(undefined, "bold");
  doc.text("Express Heart Score Grading Scale", margin, yPos);
  yPos += 4;
  doc.setFont(undefined, "normal");

  doc.setFont(undefined, "bold");
  doc.text("Score Range",    margin,      yPos);
  doc.text("Status",         margin + 32, yPos);
  doc.text("Clinical Meaning", margin + 68, yPos);
  doc.setFont(undefined, "normal");
  yPos += 4;
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 3;

  const gradeRows = [
    ["90 – 100", "ELITE",           "Peak cardiovascular efficiency."],
    ["80 – 89",  "OPTIMAL",         "Strong heart health; low risk profile."],
    ["70 – 79",  "FAIR",            "Functional, but with identified areas for optimization."],
    ["Below 70", "ACTION REQUIRED", "Significant indicators found; requires immediate cardiology consultation."],
  ];

  for (const [range, status, meaning] of gradeRows) {
    doc.text(range,  margin,      yPos);
    doc.text(status, margin + 32, yPos);
    const wrapped = doc.splitTextToSize(meaning, contentWidth - 68);
    doc.text(wrapped, margin + 68, yPos);
    yPos += wrapped.length * 4.5 + 0.5;
  }

  /* ---------------- DISCLAIMER ---------------- */
  doc.setFontSize(7.5);
  doc.setTextColor(120);
  const disclaimer =
    "DISCLAIMER: This is a preliminary health screening report prior to physician review. " +
    "It is not a medical diagnosis. All findings are subject to confirmation and approval by a licensed physician.";
  doc.text(doc.splitTextToSize(disclaimer, contentWidth), margin, pageHeight - 18);
  doc.text("Preliminary Report – Pending Physician Review", margin, pageHeight - 8);

  return URL.createObjectURL(doc.output("blob"));

  /* ========== HELPERS ========== */

  function section(title) {
    doc.setFontSize(9.5);
    doc.setFont(undefined, "bold");
    doc.setTextColor(0);
    doc.text(title, margin, yPos);
    yPos += 5;
    doc.setFontSize(8.5);
    doc.setFont(undefined, "normal");
  }

  function row(label1, value1, label2, value2) {
    doc.text(`${label1}:`, margin, yPos);
    doc.text(value1 || "", margin + 38, yPos);
    if (label2) {
      doc.text(`${label2}:`, margin + 100, yPos);
      doc.text(value2 || "", margin + 128, yPos);
    }
    yPos += 5;
  }

  function line(text) {
    doc.text(text, margin, yPos);
    yPos += 5;
  }

  function divider() {
    yPos += 1;
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 4;
  }
}
