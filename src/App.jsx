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

  // Symptoms & Medical History
  const [symptoms, setSymptoms] = useState("")
  const [bpTreatment, setBpTreatment] = useState("")
  const [smokingStatus, setSmokingStatus] = useState("")
  const [diabetesStatus, setDiabetesStatus] = useState("")

  // EKG rhythm classification for scoring
  const [ekgRhythm, setEkgRhythm] = useState("")

  // Heart sounds classification for scoring
  const [heartSoundsClassification, setHeartSoundsClassification] = useState("")

  // Express Heart Score outputs
  const [expressHeartScore, setExpressHeartScore] = useState(null)
  const [expressScoreBreakdown, setExpressScoreBreakdown] = useState(null)
  const [framinghamRisk, setFraminghamRisk] = useState("")

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


  function parseBloodPressure(bpString) {
    if (!bpString) return null
    const match = bpString.trim().match(/^(\d{2,3})\s*\/\s*(\d{2,3})$/)
    if (!match) return null
    return { systolic: parseInt(match[1], 10), diastolic: parseInt(match[2], 10) }
  }

  function calcPillar1(framRisk) {
    if (framRisk === null) return null
    if (framRisk < 10) return 20
    if (framRisk <= 20) return 10
    return 0
  }

  function calcPillar2(rhythm) {
    if (!rhythm) return null
    return { "normal-sinus": 25, "sinus-tachy-brady": 15, "afib-pvcs-other": 0 }[rhythm] ?? null
  }

  function calcPillar3(classification) {
    if (!classification) return null
    return { "normal-no-murmur": 25, "innocent-murmur": 10, "structural-murmur": 0 }[classification] ?? null
  }

  function calcPillar4(category) {
    if (!category) return null
    return { Good: 15, Average: 8, Poor: 0 }[category] ?? null
  }

  function calcPillar5(bpString, heartRateNum) {
    const bp = parseBloodPressure(bpString)
    if (!bp) return null
    const { systolic, diastolic } = bp
    const hr = Number(heartRateNum)
    if (systolic >= 140 || diastolic >= 90 || (hr && (hr < 40 || hr > 110))) return 0
    if (systolic < 120 && diastolic < 80 && hr >= 60 && hr <= 80) return 15
    return 7
  }

  function getScoreGrade(score) {
    if (score >= 90) return { label: "ELITE", color: "#16a34a" }
    if (score >= 80) return { label: "OPTIMAL", color: "#178b92" }
    if (score >= 70) return { label: "FAIR", color: "#d97706" }
    return { label: "ACTION REQUIRED", color: "#dc2626" }
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

  // Auto-calc Express Heart Score from all pillars
  useEffect(() => {
    const framRisk = framinghamRisk !== "" && !isNaN(Number(framinghamRisk)) ? Number(framinghamRisk) : null

    const p1 = calcPillar1(framRisk)
    const p2 = calcPillar2(ekgRhythm)
    const p3 = calcPillar3(heartSoundsClassification)
    const p4 = calcPillar4(fitnessCategory)
    const p5 = calcPillar5(bloodPressure, heartRate)

    const pillarValues = [p1, p2, p3, p4, p5]
    const availableCount = pillarValues.filter(v => v !== null).length

    if (availableCount < 3) {
      setExpressHeartScore(null)
      setExpressScoreBreakdown(null)
      return
    }

    const total = pillarValues.reduce((sum, v) => sum + (v ?? 0), 0)
    setExpressHeartScore(total)
    setExpressScoreBreakdown({ p1, p2, p3, p4, p5 })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [framinghamRisk, ekgRhythm, heartSoundsClassification, fitnessCategory, bloodPressure, heartRate])

  const handleGeneratePDF = () => {
    const data = {
      patientName,
      dateOfBirth,
      age,
      gender,
      symptoms,
      medicalHistory: { bpTreatment, smokingStatus, diabetesStatus },
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
        rhythm: ekgRhythm,
      },
      heartSounds: {
        status: heartSoundsStatus,
        notes: heartSoundsNotes,
        classification: heartSoundsClassification,
      },
      fitness: {
        status: fitnessStatus,
        notes: fitnessNotes,
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
      expressHeartScore: {
        total: expressHeartScore,
        grade: expressHeartScore !== null ? getScoreGrade(expressHeartScore) : null,
        framinghamRisk,
        breakdown: expressScoreBreakdown,
      },
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

      symptoms,
      bpTreatment,
      smokingStatus,
      diabetesStatus,

      ekgStatus,
      ekgNotes,
      ekgRhythm,

      heartSoundsStatus,
      heartSoundsNotes,
      heartSoundsClassification,

      fitnessTestStatus: fitnessStatus,
      fitnessTestNotes: fitnessNotes,
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

      heartRiskScore: framinghamRisk !== null ? framinghamRisk : "",
      expressHeartScore: expressHeartScore !== null ? expressHeartScore : "",
      expressScoreGrade: expressHeartScore !== null ? getScoreGrade(expressHeartScore).label : "",
      expressScoreP1: expressScoreBreakdown?.p1 ?? "",
      expressScoreP2: expressScoreBreakdown?.p2 ?? "",
      expressScoreP3: expressScoreBreakdown?.p3 ?? "",
      expressScoreP4: expressScoreBreakdown?.p4 ?? "",
      expressScoreP5: expressScoreBreakdown?.p5 ?? "",
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

          {/* Symptoms & Medical History */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Symptoms &amp; Medical History</h2>
              <p className="card-description">Patient-reported symptoms and key cardiovascular risk factors</p>
            </div>
            <div className="card-content">
              <div className="form-group">
                <label className="form-label" htmlFor="symptoms">
                  Patient-Reported Symptoms
                </label>
                <textarea
                  className="form-textarea"
                  id="symptoms"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Describe any chest pain, shortness of breath, palpitations, dizziness, syncope, or other symptoms..."
                  rows={3}
                />
              </div>
              <div className="form-grid" style={{ marginTop: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">Blood Pressure Treatment</label>
                  <div className="button-group-half">
                    <button
                      type="button"
                      className={`toggle-button ${bpTreatment === "yes" ? "active" : ""}`}
                      onClick={() => setBpTreatment("yes")}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      className={`toggle-button ${bpTreatment === "no" ? "active" : ""}`}
                      onClick={() => setBpTreatment("no")}
                    >
                      No
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Smoking / Tobacco Use</label>
                  <div className="button-group-half">
                    <button
                      type="button"
                      className={`toggle-button ${smokingStatus === "yes" ? "active" : ""}`}
                      onClick={() => setSmokingStatus("yes")}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      className={`toggle-button ${smokingStatus === "no" ? "active" : ""}`}
                      onClick={() => setSmokingStatus("no")}
                    >
                      No
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Diabetes</label>
                  <div className="button-group-half">
                    <button
                      type="button"
                      className={`toggle-button ${diabetesStatus === "yes" ? "active" : ""}`}
                      onClick={() => setDiabetesStatus("yes")}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      className={`toggle-button ${diabetesStatus === "no" ? "active" : ""}`}
                      onClick={() => setDiabetesStatus("no")}
                    >
                      No
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
                <label className="form-label">Rhythm Classification</label>
                <div className="button-group">
                  <button
                    type="button"
                    className={`toggle-button ${ekgRhythm === "normal-sinus" ? "active" : ""}`}
                    onClick={() => setEkgRhythm("normal-sinus")}
                  >
                    Normal Sinus Rhythm
                  </button>
                  <button
                    type="button"
                    className={`toggle-button ${ekgRhythm === "sinus-tachy-brady" ? "active" : ""}`}
                    onClick={() => setEkgRhythm("sinus-tachy-brady")}
                  >
                    Sinus Tachy / Bradycardia
                  </button>
                  <button
                    type="button"
                    className={`toggle-button ${ekgRhythm === "afib-pvcs-other" ? "active" : ""}`}
                    onClick={() => setEkgRhythm("afib-pvcs-other")}
                  >
                    AFib / PVCs / Other
                  </button>
                </div>
              </div>
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
                <label className="form-label">Auscultation Classification</label>
                <div className="button-group">
                  <button
                    type="button"
                    className={`toggle-button ${heartSoundsClassification === "normal-no-murmur" ? "active" : ""}`}
                    onClick={() => setHeartSoundsClassification("normal-no-murmur")}
                  >
                    Normal (No Murmur)
                  </button>
                  <button
                    type="button"
                    className={`toggle-button ${heartSoundsClassification === "innocent-murmur" ? "active" : ""}`}
                    onClick={() => setHeartSoundsClassification("innocent-murmur")}
                  >
                    Innocent Murmur
                  </button>
                  <button
                    type="button"
                    className={`toggle-button ${heartSoundsClassification === "structural-murmur" ? "active" : ""}`}
                    onClick={() => setHeartSoundsClassification("structural-murmur")}
                  >
                    Structural Murmur / Low EF
                  </button>
                </div>
              </div>
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

          {/* Framingham Risk Score */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Framingham Risk Score</h2>
              <p className="card-description">10-year cardiovascular disease risk (%)</p>
            </div>
            <div className="card-content">
              <div className="form-group">
                <label className="form-label" htmlFor="framinghamRisk">
                  10-Year CVD Risk (%)
                </label>
                <input
                  className="form-input"
                  id="framinghamRisk"
                  type="number"
                  min="0"
                  max="100"
                  value={framinghamRisk}
                  onChange={(e) => setFraminghamRisk(e.target.value)}
                  placeholder="e.g., 8"
                />
              </div>
              {framinghamRisk !== "" && !isNaN(Number(framinghamRisk)) && (
                <div className="framingham-result" style={{ marginTop: "0.75rem" }}>
                  <div
                    className="framingham-risk-label"
                    style={{
                      backgroundColor: Number(framinghamRisk) < 10 ? "#16a34a" : Number(framinghamRisk) <= 20 ? "#d97706" : "#dc2626",
                    }}
                  >
                    {Number(framinghamRisk) < 10 ? "LOW RISK" : Number(framinghamRisk) <= 20 ? "INTERMEDIATE RISK" : "HIGH RISK"}
                  </div>
                  <p className="framingham-risk-description">
                    {Number(framinghamRisk) < 10
                      ? "Less than 10% chance of a cardiovascular event in the next 10 years."
                      : Number(framinghamRisk) <= 20
                      ? "10–20% chance of a cardiovascular event in the next 10 years."
                      : "Greater than 20% chance of a cardiovascular event in the next 10 years."}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Express Heart Score */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Express Heart Score</h2>
              <p className="card-description">Auto-calculated 5-pillar cardiovascular composite score (max 100)</p>
            </div>
            <div className="card-content">
              {expressHeartScore === null ? (
                <p className="score-pending-text">
                  Complete at least 3 pillars to generate the Express Heart Score. Required inputs: EKG rhythm classification, heart sounds classification, fitness test, cholesterol panel, and vitals (blood pressure &amp; heart rate).
                </p>
              ) : (
                <>
                  <div className="score-display-row">
                    <div className="score-circle" style={{ borderColor: getScoreGrade(expressHeartScore).color }}>
                      <span className="score-number" style={{ color: getScoreGrade(expressHeartScore).color }}>
                        {expressHeartScore}
                      </span>
                      <span className="score-max">/100</span>
                    </div>
                    <div className="score-badge" style={{ backgroundColor: getScoreGrade(expressHeartScore).color }}>
                      {getScoreGrade(expressHeartScore).label}
                    </div>
                  </div>
                  {framinghamRisk !== null && (
                    <p className="score-framingham-note">
                      Framingham 10-Year CVD Risk: <strong>{framinghamRisk}%</strong>
                    </p>
                  )}
                  <table className="score-breakdown-table">
                    <thead>
                      <tr>
                        <th>Pillar</th>
                        <th>Score</th>
                        <th>Max</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Framingham Baseline (W<sub>F</sub>)</td>
                        <td className={expressScoreBreakdown.p1 === null ? "score-cell-na" : ""}>{expressScoreBreakdown.p1 ?? "—"}</td>
                        <td>20</td>
                      </tr>
                      <tr>
                        <td>EKG Rhythm Precision (W<sub>E</sub>)</td>
                        <td className={expressScoreBreakdown.p2 === null ? "score-cell-na" : ""}>{expressScoreBreakdown.p2 ?? "—"}</td>
                        <td>25</td>
                      </tr>
                      <tr>
                        <td>Acoustic &amp; Structural Integrity (W<sub>A</sub>)</td>
                        <td className={expressScoreBreakdown.p3 === null ? "score-cell-na" : ""}>{expressScoreBreakdown.p3 ?? "—"}</td>
                        <td>25</td>
                      </tr>
                      <tr>
                        <td>Metabolic Power VO₂ Max (W<sub>V</sub>)</td>
                        <td className={expressScoreBreakdown.p4 === null ? "score-cell-na" : ""}>{expressScoreBreakdown.p4 ?? "—"}</td>
                        <td>15</td>
                      </tr>
                      <tr>
                        <td>Hemodynamic Stability (W<sub>B</sub>)</td>
                        <td className={expressScoreBreakdown.p5 === null ? "score-cell-na" : ""}>{expressScoreBreakdown.p5 ?? "—"}</td>
                        <td>15</td>
                      </tr>
                      <tr className="score-total-row">
                        <td><strong>Total Score</strong></td>
                        <td><strong>{expressHeartScore}</strong></td>
                        <td><strong>100</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </>
              )}
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
