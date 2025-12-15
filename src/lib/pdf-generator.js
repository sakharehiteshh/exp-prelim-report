import jsPDF from "jspdf";

export function generatePDF(data) {
  const doc = new jsPDF({ format: "letter" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPos = 18;

  /* ---------------- HEADER ---------------- */
  const logo = new Image();
  logo.src = "/expressheartcarelogo.png";

  // SAFE image add (prevents crash)
  try {
    doc.addImage(logo, "PNG", margin, yPos, 24, 24);
  } catch (e) {}

  doc.setFontSize(13);
  doc.setFont(undefined, "bold");
  doc.text("Express Heart Care", margin + 35, yPos + 8);

  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  doc.text("Preliminary Cardiac Screening Report", margin + 35, yPos + 14);
  doc.text("(314) 557-2620 | expressheartcare@gmail.com", margin + 35, yPos + 20);

  yPos += 34;
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  /* ---------------- PATIENT INFO ---------------- */
  section("Patient Information");

  row("Name", data.patientName, "Height", data.vitals?.height);
  row("DOB", data.dateOfBirth, "Weight", data.vitals?.weight ? `${data.vitals.weight} lbs` : "");
  row("Gender", data.gender, "BMI", data.vitals?.bmi);
  row("Age", data.age);

  divider();

  /* ---------------- VITALS ---------------- */
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
  line(`Sit-to-Stand (30s): ${data.fitness?.sitStandCount || "N/A"}`);
  line(`Estimated VO2 Max: ${data.fitness?.vo2Max || "N/A"} ml/kg/min`);
  line(`Functional Category: ${data.fitness?.fitnessCategory || "N/A"}`);

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

  doc.text(
    doc.splitTextToSize(disclaimer, contentWidth),
    margin,
    pageHeight - 22
  );

  doc.text("Preliminary Report – Pending Physician Review", margin, pageHeight - 10);

  return URL.createObjectURL(doc.output("blob"));

  /* ===== helpers ===== */

  function section(title) {
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text(title, margin, yPos);
    yPos += 8;
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
  }

  function row(l1, v1, l2, v2) {
    doc.text(`${l1}:`, margin, yPos);
    doc.text(v1 || "", margin + 28, yPos);
    if (l2) {
      doc.text(`${l2}:`, margin + 95, yPos);
      doc.text(v2 || "", margin + 120, yPos);
    }
    yPos += 6;
  }

  function line(text) {
    doc.text(text, margin, yPos);
    yPos += 6;
  }

  function divider() {
    yPos += 4;
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;
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
      yPos += lines.length * 4;
    }
    divider();
  }
}
