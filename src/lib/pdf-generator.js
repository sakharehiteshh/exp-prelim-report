import jsPDF from "jspdf";

export function generatePDF(data) {
  const doc = new jsPDF({ format: "letter" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPos = 18;

/* ---------------- HEADER ---------------- */
  const logo = require("../assets/expressheartcarelogo.png");
  doc.addImage(logo, "PNG", margin, yPos, 53, 17);
  

  doc.setFontSize(13);
  doc.setFont(undefined, "bold");
  doc.text("Express Heart Tests", margin + 75, yPos + 8);

  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  doc.text("Preliminary Cardiac Screening Report", margin + 75, yPos + 14);
  doc.text("(314) 557-2620 | expressheartcare@gmail.com", margin + 75, yPos + 20);

  yPos += 24;
  divider();

  /* ---------------- PATIENT INFORMATION ---------------- */
  section("Patient Information");

  row("Name", data.patientName, "Height", data.vitals?.height);
  row("DOB", data.dateOfBirth, "Weight", data.vitals?.weight ? `${data.vitals.weight} lbs` : "");
  row("Gender", data.gender, "BMI", data.vitals?.bmi);
  row("Age", data.age);

  divider();

  /* ---------------- VITAL SIGNS ---------------- */
  section("Vital Signs");

  row("Blood Pressure", data.vitals?.bloodPressure, "Heart Rate", data.vitals?.heartRate ? `${data.vitals.heartRate} bpm` : "");
  row("Oxygen Saturation", data.vitals?.o2Level ? `${data.vitals.o2Level}%` : "");

  divider();

  /* ---------------- EKG ---------------- */
  resultSection("Electrocardiogram (EKG)", data.ekg?.status, data.ekg?.notes);

  /* ---------------- HEART SOUNDS ---------------- */
  resultSection("Heart Sounds Examination", data.heartSounds?.status, data.heartSounds?.notes);

/* ---------------- FITNESS ---------------- */
section("Fitness Assessment");

// Status inline on the right (same style as EKG)
doc.text(
  `Result: ${data.fitness?.status === "normal" ? "Normal" : "Needs Review"}`,
  pageWidth - margin - 55,
  yPos - 8
);

// Notes (if any)
if (data.fitness?.notes) {
  const lines = doc.splitTextToSize(data.fitness.notes, contentWidth);
  doc.text(lines, margin + 5, yPos);
  yPos += lines.length * 4 + 2;
}

// Sit-to-Stand data
line(`30s Sit-to-Stand Count: ${data.fitness?.sitStandCount || "N/A"}`);
line(`Estimated VO2 Max: ${data.fitness?.vo2Max || "N/A"} ml/kg/min`);
line(`Functional Category: ${data.fitness?.fitnessCategory || "N/A"}`);

divider();


  /* ---------------- BLOOD TEST RESULTS ---------------- */
  section("Finger Stick Cholesterol Test");

  row("Total Cholesterol", data.cholesterol?.total ? `${data.cholesterol.total} mg/dL` : "",
      "LDL", data.cholesterol?.ldl ? `${data.cholesterol.ldl} mg/dL` : "");

  row("HDL", data.cholesterol?.hdl ? `${data.cholesterol.hdl} mg/dL` : "",
      "Triglycerides", data.cholesterol?.triglycerides ? `${data.cholesterol.triglycerides} mg/dL` : "");

  row("Glucose", data.cholesterol?.glucose ? `${data.cholesterol.glucose} mg/dL` : "",
      "Status", data.cholesterol?.status === "normal" ? "Normal" : "Needs Review");

  if (data.cholesterol?.notes) {
    line("Notes:");
    const lines = doc.splitTextToSize(data.cholesterol.notes, contentWidth);
    doc.text(lines, margin + 5, yPos);
    yPos += lines.length * 4 + 2;
  }

  divider();

  /* ---------------- HEART RISK ---------------- */
  section("Heart Risk Score");
  line(data.heartRiskScore || "Not assessed");

  /* ---------------- DISCLAIMER ---------------- */
  doc.setFontSize(8);
  doc.setTextColor(120);

  const disclaimer =
    "DISCLAIMER: This is a preliminary health screening report prior to physician review. " +
    "It is not a medical diagnosis. All findings are subject to confirmation and approval by a licensed physician.";

  doc.text(doc.splitTextToSize(disclaimer, contentWidth), margin, pageHeight - 22);
  doc.text("Preliminary Report – Pending Physician Review", margin, pageHeight - 10);

  return URL.createObjectURL(doc.output("blob"));

  /* ========== HELPERS ========== */

  function section(title) {
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.setTextColor(0);
    doc.text(title, margin, yPos);
    yPos += 8;
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
  }

  function row(label1, value1, label2, value2) {
    doc.text(`${label1}:`, margin, yPos);
    doc.text(value1 || "", margin + 40, yPos);

    if (label2) {
      doc.text(`${label2}:`, margin + 110, yPos);
      doc.text(value2 || "", margin + 140, yPos);
    }

    yPos += 6;
  }

  function line(text) {
    doc.text(text, margin, yPos);
    yPos += 6;
  }

  function divider() {
    yPos += 2;
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 6;
  }

  function resultSection(title, status, notes) {
    section(title);
    doc.text(
      `Result: ${status === "normal" ? "Normal" : "Needs Review"}`,
      pageWidth - margin - 55,
      yPos - 8
    );

    if (notes) {
      const lines = doc.splitTextToSize(notes, contentWidth);
      doc.text(lines, margin + 5, yPos);
      yPos += lines.length * 4 + 2;
    }

    divider();
  }
}
