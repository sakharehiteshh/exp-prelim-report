export function generatePDF(data) {
  const { jsPDF } = window.jspdf;

  const doc = new jsPDF({ format: "letter" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  let yPos = 15;

  /* ---------------------------------
     HEADER
  --------------------------------- */
  const logoImg = new Image();
  logoImg.src = "/expressheartcarelogo.png";
  doc.addImage(logoImg, "PNG", margin, yPos, 24, 24);

  doc.setFontSize(13);
  doc.setFont(undefined, "bold");
  doc.text("Express Heart Care", margin + 35, yPos + 8);

  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  doc.text("Preliminary Cardiac Screening Report", margin + 35, yPos + 14);
  doc.text("(314) 248-4076 | expressheartcare@gmail.com", margin + 35, yPos + 20);

  yPos += 34;
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  /* ---------------------------------
     PATIENT INFORMATION
  --------------------------------- */
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text("Patient Information", margin, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont(undefined, "normal");

  doc.text("Name:", margin, yPos);
  doc.text(data.patientName || "", margin + 25, yPos);

  doc.text("Height:", margin + 95, yPos);
  doc.text(data.vitals?.height || "", margin + 120, yPos);
  yPos += 6;

  doc.text("DOB:", margin, yPos);
  doc.text(data.dateOfBirth || "", margin + 25, yPos);

  doc.text("Weight:", margin + 95, yPos);
  doc.text(
    data.vitals?.weight ? `${data.vitals.weight} lbs` : "",
    margin + 120,
    yPos
  );
  yPos += 6;

  doc.text("Gender:", margin, yPos);
  doc.text(data.gender || "", margin + 25, yPos);

  doc.text("BMI:", margin + 95, yPos);
  doc.text(data.vitals?.bmi || "", margin + 120, yPos);
  yPos += 6;

  doc.text("Age:", margin, yPos);
  doc.text(data.age || "", margin + 25, yPos);

  yPos += 10;
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  /* ---------------------------------
     VITAL SIGNS
  --------------------------------- */
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text("Vital Signs", margin, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont(undefined, "normal");

  doc.text("Blood Pressure:", margin, yPos);
  doc.text(data.vitals?.bloodPressure || "", margin + 45, yPos);

  doc.text("Heart Rate:", margin + 95, yPos);
  doc.text(
    data.vitals?.heartRate ? `${data.vitals.heartRate} bpm` : "",
    margin + 120,
    yPos
  );
  yPos += 6;

  doc.text("Oxygen Saturation:", margin, yPos);
  doc.text(
    data.vitals?.o2Level ? `${data.vitals.o2Level}%` : "",
    margin + 45,
    yPos
  );

  yPos += 10;
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  /* ---------------------------------
     EKG
  --------------------------------- */
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text("Electrocardiogram (EKG)", margin, yPos);

  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  doc.text(
    `Result: ${data.ekg?.status === "normal" ? "Normal" : "Needs Review"}`,
    pageWidth - margin - 55,
    yPos
  );
  yPos += 7;

  doc.text("Notes:", margin, yPos);
  yPos += 4;

  if (data.ekg?.notes) {
    const lines = doc.splitTextToSize(data.ekg.notes, contentWidth - 5);
    doc.text(lines, margin + 5, yPos);
    yPos += lines.length * 4;
  }

  yPos += 6;
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  /* ---------------------------------
     HEART SOUNDS
  --------------------------------- */
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text("Heart Sounds Examination", margin, yPos);

  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  doc.text(
    `Result: ${data.heartSounds?.status === "normal" ? "Normal" : "Needs Review"}`,
    pageWidth - margin - 55,
    yPos
  );
  yPos += 7;

  doc.text("Notes:", margin, yPos);
  yPos += 4;

  if (data.heartSounds?.notes) {
    const lines = doc.splitTextToSize(data.heartSounds.notes, contentWidth - 5);
    doc.text(lines, margin + 5, yPos);
    yPos += lines.length * 4;
  }

  yPos += 6;
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  /* ---------------------------------
     FITNESS TEST
  --------------------------------- */
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text("Fitness Assessment", margin, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont(undefined, "normal");

  doc.text(
    `30s Sit-to-Stand Repetitions: ${data.fitness?.sitStandCount || "N/A"}`,
    margin,
    yPos
  );
  yPos += 6;

  doc.text(
    `Estimated VO2 Max: ${
      data.fitness?.vo2Max
        ? `${data.fitness.vo2Max} ml/kg/min`
        : "N/A"
    }`,
    margin,
    yPos
  );
  yPos += 6;

  doc.text(
    `Functional Category: ${data.fitness?.fitnessCategory || "N/A"}`,
    margin,
    yPos
  );

  yPos += 10;
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  /* ---------------------------------
     HEART RISK SCORE
  --------------------------------- */
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text("Heart Risk Score", margin, yPos);
  yPos += 7;

  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  doc.text(data.heartRiskScore || "Not assessed", margin, yPos);

  /* ---------------------------------
     DISCLAIMER (FOOTER)
  --------------------------------- */
  const disclaimer =
    "DISCLAIMER: This document is a preliminary health screening report generated prior to physician review. " +
    "It is not a medical diagnosis. All findings are subject to confirmation, modification, and approval by a licensed physician. " +
    "Patients should not make medical decisions based solely on this report.";

  doc.setFontSize(8);
  doc.setTextColor(120);
  const disclaimerLines = doc.splitTextToSize(disclaimer, contentWidth);
  doc.text(disclaimerLines, margin, pageHeight - 20);

  doc.text(
    "Preliminary Report – Pending Physician Review",
    margin,
    pageHeight - 8
  );

  /* ---------------------------------
     OUTPUT
  --------------------------------- */
  const pdfBlob = doc.output("blob");
  return URL.createObjectURL(pdfBlob);
}
