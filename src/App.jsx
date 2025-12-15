"use client"

import { useState, useEffect } from "react"
import { generatePDF } from "./lib/pdf-generator"
import { saveToGoogleSheets } from "./actions/save-to-sheets.js"
import "./App.css"

if (typeof window !== "undefined" && !window.jspdf) {
  const script = document.createElement("script")
  script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
  script.async = true
  document.head.appendChild(script)
}

export default function PatientDemographicsApp() {
  const [patientName, setPatientName] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [age, setAge] = useState("")
  const [gender, setGender] = useState("")

  const [heightFeet, setHeightFeet] = useState("")
  const [heightInches, setHeightInches] = useState("")
  const [weight, setWeight] = useState("")
  const [bmi, setBmi] = useState("")
  const [bloodPressure, setBloodPressure] = useState("")
  const [o2Level, setO2Level] = useState("")
  const [heartRate, setHeartRate] = useState("")

  const [ekgStatus, setEkgStatus] = useState("normal")
  const [ekgNotes, setEkgNotes] = useState("")

  const [heartSoundsStatus, setHeartSoundsStatus] = useState("normal")
  const [heartSoundsNotes, setHeartSoundsNotes] = useState("")

  const [fitnessStatus, setFitnessStatus] = useState("normal")
  const [fitnessNotes, setFitnessNotes] = useState("")

  // 🔹 NEW: 30-second Sit-to-Stand test
  const [sitStandCount, setSitStandCount] = useState("") // 30sSTST repetitions
  const [vo2Max, setVo2Max] = useState("")               // Derived VO2 max
  const [fitnessCategory, setFitnessCategory] = useState("") // Poor / Average / Good

  const [totalCholesterol, setTotalCholesterol] = useState("")
  const [ldlCholesterol, setLdlCholesterol] = useState("")
  const [hdlCholesterol, setHdlCholesterol] = useState("")
  const [triglycerides, setTriglycerides] = useState("")
  const [glucose, setGlucose] = useState("")
  const [cholesterolStatus, setCholesterolStatus] = useState("normal")
  const [cholesterolNotes, setCholesterolNotes] = useState("")

  const [heartRiskScore, setHeartRiskScore] = useState("")

  const [recipientEmail, setRecipientEmail] = useState("")
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [isSavingToSheets, setIsSavingToSheets] = useState(false)

  // Auto-calc age from DOB
  useEffect(() => {
    if (dateOfBirth) {
      const today = new Date()
      const birthDate = new Date(dateOfBirth)
      let calculatedAge = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--
      }

      setAge(calculatedAge.toString())
    }
  }, [dateOfBirth])

  // Auto-calc BMI
  useEffect(() => {
    if ((heightFeet || heightInches) && weight) {
      const totalInches = (Number.parseFloat(heightFeet) || 0) * 12 + (Number.parseFloat(heightInches) || 0)
      const weightInLbs = Number.parseFloat(weight)

      if (totalInches > 0 && weightInLbs > 0) {
        const calculatedBmi = ((weightInLbs / (totalInches * totalInches)) * 703).toFixed(1)
        setBmi(calculatedBmi)
      }
    }
  }, [heightFeet, heightInches, weight])

  // 🔹 Helper: classify 30sSTST performance as Poor / Average / Good
  function classifySitStand(count, numericAge, genderCode) {
  const reps = Number(count);
  const ageNum = Number(numericAge);

  if (!reps || reps <= 0 || !ageNum) return "";

  // Unified normative table from youth → seniors
  // Values represent typical 25–75 percentile ranges.
  const table = [
    { minAge: 18, maxAge: 29, female: [12, 18], male: [14, 20], unisex: [13, 19] },
    { minAge: 30, maxAge: 39, female: [11, 17], male: [13, 19], unisex: [12, 18] },
    { minAge: 40, maxAge: 49, female: [10, 16], male: [12, 18], unisex: [11, 17] },
    { minAge: 50, maxAge: 59, female: [9, 15],  male: [11, 17], unisex: [10, 16] },
    { minAge: 60, maxAge: 64, female: [12, 17], male: [14, 19], unisex: [13, 18] },
    { minAge: 65, maxAge: 69, female: [11, 16], male: [12, 18], unisex: [11, 17] },
    { minAge: 70, maxAge: 74, female: [10, 15], male: [12, 17], unisex: [11, 16] },
    { minAge: 75, maxAge: 79, female: [10, 15], male: [11, 17], unisex: [10, 16] },
    { minAge: 80, maxAge: 84, female: [9, 14],  male: [10, 15], unisex: [9, 15] },
    { minAge: 85, maxAge: 89, female: [8, 13],  male: [8, 14],  unisex: [8, 13] },
    { minAge: 90, maxAge: 94, female: [4, 11],  male: [7, 12],  unisex: [5, 11] }
  ];

  // Find exact age range OR closest match
  let row = table.find(r => ageNum >= r.minAge && ageNum <= r.maxAge);

  if (!row) {
    // pick nearest
    row = table.reduce((prev, curr) =>
      Math.abs(curr.minAge - ageNum) < Math.abs(prev.minAge - ageNum)
        ? curr
        : prev
    );
  }

  let [low, high] =
    genderCode === "M" ? row.male :
    genderCode === "F" ? row.female :
    row.unisex;

  if (reps < low) return "Poor";
  if (reps > high) return "Good";
  return "Average";
}


  // 🔹 Auto-calc VO2 max + category from 30sSTST
  useEffect(() => {
    const reps = Number.parseFloat(sitStandCount)
    if (!reps || reps <= 0) {
      setVo2Max("")
      setFitnessCategory("")
      return
    }

    // VO2 max formula: 0.769 × 30sSTST + 2.567
    const vo2 = 0.769 * reps + 2.567
    setVo2Max(vo2.toFixed(1))

    const category = classifySitStand(reps, age, gender)
    setFitnessCategory(category)
  }, [sitStandCount, age, gender])

  const handleGeneratePDF = () => {
    const data = {
      patientName,
      dateOfBirth,
      age,
      gender,
      vitals: {
        height: heightFeet && heightInches ? `${heightFeet}'${heightInches}"` : heightFeet ? `${heightFeet}'0"` : "",
        weight,
        bmi,
        bloodPressure,
        o2Level,
        heartRate,
      },
      ekg: {
        status: ekgStatus,
        notes: ekgNotes,
      },
      heartSounds: {
        status: heartSoundsStatus,
        notes: heartSoundsNotes,
      },
      fitness: {
        status: fitnessStatus,
        notes: fitnessNotes,
        // 🔹 Include STST data in the PDF payload as well
        sitStandCount,
        vo2Max,
        fitnessCategory,
      },
      cholesterol: {
        total: totalCholesterol,
        ldl: ldlCholesterol,
        hdl: hdlCholesterol,
        triglycerides,
        glucose,
        status: cholesterolStatus,
        notes: cholesterolNotes,
      },
      heartRiskScore,
    }

    const pdfUrl = generatePDF(data)
    window.open(pdfUrl, "_blank")
  }

  const handleSendEmail = async () => {
    if (!recipientEmail) {
      alert("Please enter a recipient email address.")
      return
    }

    if (!patientName || !dateOfBirth) {
      alert("Please fill in at least patient name and date of birth.")
      return
    }

    setIsSendingEmail(true)
    alert("Email functionality requires backend integration. PDF will be generated for preview.")
    handleGeneratePDF()
    setIsSendingEmail(false)
  }

  const handleSaveToSheets = async () => {
    if (!patientName || !dateOfBirth) {
      alert("Please fill in at least patient name and date of birth before saving.")
      return
    }

    setIsSavingToSheets(true)

    const heightDisplay =
      heightFeet && heightInches
        ? `${heightFeet}'${heightInches}"`
        : heightFeet
        ? `${heightFeet}'0"`
        : ""

    // 🔴 FLAT payload – keys MUST match Apps Script doPost
    const payload = {
      patientName,
      dateOfBirth,
      age,
      gender,
      height: heightDisplay,
      weightLbs: weight,
      bmi,
      bloodPressure,
      o2Level,
      heartRate,

      ekgStatus,
      ekgNotes,

      heartSoundsStatus,
      heartSoundsNotes,

      fitnessTestStatus: fitnessStatus,
      fitnessTestNotes: fitnessNotes,

      // 🔹 STST data to sheet too (optional, but useful)
      sitStandCount,
      vo2Max,
      fitnessCategory,

      totalCholesterol,
      ldlCholesterol,
      hdlCholesterol,
      triglycerides,
      glucose,

      totalCholesterolStatus: cholesterolStatus,
      totalCholesterolNotes: cholesterolNotes,

      heartRiskScore,
    }

    try {
      const result = await saveToGoogleSheets(payload)

      if (result.success) {
        alert(result.message)
      } else {
        alert(`Error: ${result.message}`)
      }
    } catch (error) {
      alert(`Error saving to Google Sheets: ${error.message}`)
    } finally {
      setIsSavingToSheets(false)
    }
  }

  return (
    <div className="app-container">
      <div className="app-content">
        <div className="app-header">
          <svg className="app-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <h1 className="app-title">Patient Medical Examination</h1>
        </div>

        <div className="cards-container">
          {/* Patient Demographics */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Patient Demographics</h2>
              <p className="card-description">Basic patient information</p>
            </div>
            <div className="card-content">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="patientName">
                    Patient Name
                  </label>
                  <input
                    className="form-input"
                    id="patientName"
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Enter full name"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="dateOfBirth">
                    Date of Birth
                  </label>
                  <input
                    className="form-input"
                    id="dateOfBirth"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="age">
                    Age
                  </label>
                  <input
                    className="form-input readonly"
                    id="age"
                    type="text"
                    value={age}
                    readOnly
                    placeholder="Auto-calculated"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <div className="button-group">
                    <button
                      type="button"
                      className={`toggle-button ${gender === "M" ? "active" : ""}`}
                      onClick={() => setGender("M")}
                    >
                      Male
                    </button>
                    <button
                      type="button"
                      className={`toggle-button ${gender === "F" ? "active" : ""}`}
                      onClick={() => setGender("F")}
                    >
                      Female
                    </button>
                    <button
                      type="button"
                      className={`toggle-button ${gender === "Unknown" ? "active" : ""}`}
                      onClick={() => setGender("Unknown")}
                    >
                      Unknown
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Vitals */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Test Vitals</h2>
              <p className="card-description">Vital signs and measurements</p>
            </div>
            <div className="card-content">
              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">Height</label>
                  <div className="input-row">
                    <input
                      className="form-input"
                      type="number"
                      value={heightFeet}
                      onChange={(e) => setHeightFeet(e.target.value)}
                      placeholder="Feet"
                      min="0"
                    />
                    <input
                      className="form-input"
                      type="number"
                      value={heightInches}
                      onChange={(e) => setHeightInches(e.target.value)}
                      placeholder="Inches"
                      min="0"
                      max="11"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="weight">
                    Weight (lbs)
                  </label>
                  <input
                    className="form-input"
                    id="weight"
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="e.g., 150"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="bmi">
                    BMI
                  </label>
                  <input
                    className="form-input readonly"
                    id="bmi"
                    type="text"
                    value={bmi}
                    readOnly
                    placeholder="Auto-calculated"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="bloodPressure">
                    Blood Pressure
                  </label>
                  <input
                    className="form-input"
                    id="bloodPressure"
                    type="text"
                    value={bloodPressure}
                    onChange={(e) => setBloodPressure(e.target.value)}
                    placeholder="e.g., 120/80"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="o2Level">
                    O2 Level (%)
                  </label>
                  <input
                    className="form-input"
                    id="o2Level"
                    type="number"
                    value={o2Level}
                    onChange={(e) => setO2Level(e.target.value)}
                    placeholder="e.g., 98"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="heartRate">
                    Heart Rate (bpm)
                  </label>
                  <input
                    className="form-input"
                    id="heartRate"
                    type="number"
                    value={heartRate}
                    onChange={(e) => setHeartRate(e.target.value)}
                    placeholder="e.g., 72"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* EKG/ECG */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">EKG/ECG</h2>
              <p className="card-description">Electrocardiogram results</p>
            </div>
            <div className="card-content">
              <div className="form-group">
                <label className="form-label">Status</label>
                <div className="button-group-half">
                  <button
                    type="button"
                    className={`toggle-button ${ekgStatus === "normal" ? "active" : ""}`}
                    onClick={() => setEkgStatus("normal")}
                  >
                    Normal
                  </button>
                  <button
                    type="button"
                    className={`toggle-button ${ekgStatus === "needs-review" ? "active" : ""}`}
                    onClick={() => setEkgStatus("needs-review")}
                  >
                    Needs Review
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="ekgNotes">
                  Notes
                </label>
                <textarea
                  className="form-textarea"
                  id="ekgNotes"
                  value={ekgNotes}
                  onChange={(e) => setEkgNotes(e.target.value)}
                  placeholder="Add any additional notes..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Heart Sounds Exam */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Heart Sounds Exam</h2>
              <p className="card-description">Auscultation examination results</p>
            </div>
            <div className="card-content">
              <div className="form-group">
                <label className="form-label">Status</label>
                <div className="button-group-half">
                  <button
                    type="button"
                    className={`toggle-button ${heartSoundsStatus === "normal" ? "active" : ""}`}
                    onClick={() => setHeartSoundsStatus("normal")}
                  >
                    Normal
                  </button>
                  <button
                    type="button"
                    className={`toggle-button ${heartSoundsStatus === "needs-review" ? "active" : ""}`}
                    onClick={() => setHeartSoundsStatus("needs-review")}
                  >
                    Needs Review
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="heartSoundsNotes">
                  Notes
                </label>
                <textarea
                  className="form-textarea"
                  id="heartSoundsNotes"
                  value={heartSoundsNotes}
                  onChange={(e) => setHeartSoundsNotes(e.target.value)}
                  placeholder="Add any additional notes..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Quick Fitness Test */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Quick Fitness Test</h2>
              <p className="card-description">
                30-second sit-to-stand (30sSTST) plus overall fitness assessment
              </p>
            </div>
            <div className="card-content">
              {/* NEW: 30s Sit-to-Stand Inputs/Outputs */}
              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label" htmlFor="sitStandCount">
                    30-second Sit-to-Stand Count (30sSTST)
                  </label>
                  <input
                    className="form-input"
                    id="sitStandCount"
                    type="number"
                    min="0"
                    value={sitStandCount}
                    onChange={(e) => setSitStandCount(Number(e.target.value))}
                    placeholder="e.g., 12"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="vo2Max">
                    Estimated VO₂ max
                  </label>
                  <input
                    className="form-input readonly"
                    id="vo2Max"
                    type="text"
                    value={vo2Max}
                    readOnly
                    placeholder="Auto-calculated"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="fitnessCategory">
                    Functional Category
                  </label>
                  <input
                    className="form-input readonly"
                    id="fitnessCategory"
                    type="text"
                    value={fitnessCategory}
                    readOnly
                    placeholder="Poor / Average / Good"
                  />
                </div>
              </div>

              {/* Existing status + notes */}
              <div className="form-group">
                <label className="form-label">Status</label>
                <div className="button-group-half">
                  <button
                    type="button"
                    className={`toggle-button ${fitnessStatus === "normal" ? "active" : ""}`}
                    onClick={() => setFitnessStatus("normal")}
                  >
                    Normal
                  </button>
                  <button
                    type="button"
                    className={`toggle-button ${fitnessStatus === "needs-review" ? "active" : ""}`}
                    onClick={() => setFitnessStatus("needs-review")}
                  >
                    Needs Review
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="fitnessNotes">
                  Notes
                </label>
                <textarea
                  className="form-textarea"
                  id="fitnessNotes"
                  value={fitnessNotes}
                  onChange={(e) => setFitnessNotes(e.target.value)}
                  placeholder="Add any additional notes..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Finger Stick Cholesterol Test */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Finger Stick Cholesterol Test</h2>
              <p className="card-description">Lipid panel results</p>
            </div>
            <div className="card-content">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="totalCholesterol">
                    Total Cholesterol (mg/dL)
                  </label>
                  <input
                    className="form-input"
                    id="totalCholesterol"
                    type="number"
                    value={totalCholesterol}
                    onChange={(e) => setTotalCholesterol(e.target.value)}
                    placeholder="e.g., 200"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="ldlCholesterol">
                    LDL Cholesterol (mg/dL)
                  </label>
                  <input
                    className="form-input"
                    id="ldlCholesterol"
                    type="number"
                    value={ldlCholesterol}
                    onChange={(e) => setLdlCholesterol(e.target.value)}
                    placeholder="e.g., 100"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="hdlCholesterol">
                    HDL Cholesterol (mg/dL)
                  </label>
                  <input
                    className="form-input"
                    id="hdlCholesterol"
                    type="number"
                    value={hdlCholesterol}
                    onChange={(e) => setHdlCholesterol(e.target.value)}
                    placeholder="e.g., 50"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="triglycerides">
                    Triglycerides (mg/dL)
                  </label>
                  <input
                    className="form-input"
                    id="triglycerides"
                    type="number"
                    value={triglycerides}
                    onChange={(e) => setTriglycerides(e.target.value)}
                    placeholder="e.g., 150"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="glucose">
                    Glucose (mg/dL)
                  </label>
                  <input
                    className="form-input"
                    id="glucose"
                    type="number"
                    value={glucose}
                    onChange={(e) => setGlucose(e.target.value)}
                    placeholder="e.g., 90"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <div className="button-group-half">
                    <button
                      type="button"
                      className={`toggle-button ${cholesterolStatus === "normal" ? "active" : ""}`}
                      onClick={() => setCholesterolStatus("normal")}
                    >
                      Normal
                    </button>
                    <button
                      type="button"
                      className={`toggle-button ${cholesterolStatus === "needs-review" ? "active" : ""}`}
                      onClick={() => setCholesterolStatus("needs-review")}
                    >
                      Needs Review
                    </button>
                  </div>
                </div>

                <div className="form-group full-width">
                  <label className="form-label" htmlFor="cholesterolNotes">
                    Notes
                  </label>
                  <textarea
                    className="form-textarea"
                    id="cholesterolNotes"
                    value={cholesterolNotes}
                    onChange={(e) => setCholesterolNotes(e.target.value)}
                    placeholder="Add any additional notes..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Heart Risk Score */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Heart Risk Score</h2>
              <p className="card-description">Overall cardiovascular risk assessment</p>
            </div>
            <div className="card-content">
              <div className="form-group">
                <label className="form-label" htmlFor="heartRiskScore">
                  Risk Score
                </label>
                <input
                  className="form-input"
                  id="heartRiskScore"
                  type="text"
                  value={heartRiskScore}
                  onChange={(e) => setHeartRiskScore(e.target.value)}
                  placeholder="Enter calculated risk score"
                />
              </div>
            </div>
          </div>

          {/* Email Report Card */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Email Report</h2>
              <p className="card-description">Send the preliminary report via email</p>
            </div>
            <div className="card-content">
              <div className="form-group">
                <label className="form-label" htmlFor="recipientEmail">
                  Recipient Email Address
                </label>
                <input
                  className="form-input"
                  id="recipientEmail"
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="doctor@example.com"
                />
              </div>
              <button className="primary-button" onClick={handleSendEmail} disabled={isSendingEmail}>
                <svg className="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                {isSendingEmail ? "Sending..." : "Send Report via Email"}
              </button>
            </div>
          </div>

          {/* Generate Report Button */}
          <div className="button-row">
            <button className="secondary-button large" onClick={handleSaveToSheets} disabled={isSavingToSheets}>
              <svg className="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                />
              </svg>
              {isSavingToSheets ? "Saving..." : "Save Data to Google Sheets"}
            </button>

            <button className="primary-button large" onClick={handleGeneratePDF}>
              <svg className="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Generate Preliminary Report (PDF)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
