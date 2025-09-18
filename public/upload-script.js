// 🌐 Backend URL (Render or local)
const BACKEND_URL = "https://thinkbit-h81d.onrender.com/analyze";

// DOM Elements
const fileInput = document.getElementById("file-input");
const fileInfo = document.getElementById("file-info");
const fileName = document.getElementById("file-name");
const fileSize = document.getElementById("file-size");
const uploadArea = document.getElementById("upload-area");
const quickSummaryBtn = document.getElementById("quick-summary-btn");
const botSummaryBtn = document.getElementById("bot-summary-btn");
const chooseFileBtn = document.getElementById("choose-file-btn");
const progressBar = document.getElementById("progress-bar");
const progressFill = document.getElementById("progress-fill");

// Global variables
let selectedFile = null;
let extractedText = "";

// Event listeners
document.addEventListener("DOMContentLoaded", () => {
  // Wake up backend server to reduce cold start delay
  if (BACKEND_URL) {
    fetch(BACKEND_URL, { method: "HEAD" })
      .then(() => console.log("Backend wake-up ping sent"))
      .catch(() => console.log("Backend wake-up ping failed"));
  }
  initializeApp();

fileInput.addEventListener("change", handleFileSelect);
uploadArea.addEventListener("click", () => fileInput.click());
uploadArea.addEventListener("dragover", handleDragOver);
uploadArea.addEventListener("dragleave", handleDragLeave);
uploadArea.addEventListener("drop", handleDrop);

quickSummaryBtn.addEventListener("click", () => analyzeDocument("/summary"));
botSummaryBtn.addEventListener("click", () => analyzeDocument("/details"));
chooseFileBtn.addEventListener("click", () => fileInput.click());
});

// Initialize
function initializeApp() {
  console.log("LegalEase AI initialized");
  addFeatureInteractions();
}

// File handling
function handleFileSelect() {
  const file = fileInput.files[0];
  if (!file) return;

  if (validateFile(file)) {
    selectedFile = file;
    displayFileInfo(file);
    updateUploadAreaSuccess();
  }
}

function validateFile(file) {
  const allowedTypes = [".pdf", ".doc", ".docx", ".txt"];
  const ext = "." + file.name.split(".").pop().toLowerCase();

  if (!allowedTypes.includes(ext)) {
    showAlert("Invalid file type. Upload PDF, DOC, DOCX, or TXT", "error");
    return false;
  }

  if (file.size > 10 * 1024 * 1024) {
    showAlert("File size must be less than 10MB", "error");
    return false;
  }
  return true;
}

function displayFileInfo(file) {
  fileName.textContent = file.name;
  fileSize.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
  fileInfo.style.display = "block";
}

function updateUploadAreaSuccess() {
  uploadArea.innerHTML = `
    <span class="upload-icon">✅</span>
    <div class="upload-text">Document ready for analysis</div>
    <div class="upload-subtext">Click to choose different file</div>
  `;
}

// Drag/drop
function handleDragOver(e) { e.preventDefault(); uploadArea.classList.add("dragover"); }
function handleDragLeave(e) { e.preventDefault(); uploadArea.classList.remove("dragover"); }
function handleDrop(e) {
  e.preventDefault();
  uploadArea.classList.remove("dragover");
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    fileInput.files = files;
    handleFileSelect();
  }
}

// ✅ Analyze document (with legal check)
async function analyzeDocument(targetPage) {
  if (!selectedFile) {
    showAlert("Please select a document first!", "warning");
    return;
  }

  startAnalysis();

  try {
    const text = await extractText(selectedFile);
    extractedText = text;

    // Step 1: Check if the document is legal
    const checkResponse = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `Classify this document: Is it a legal document (contract, agreement, court filing, law text, etc.)? Answer strictly with YES or NO.\n\nDocument:\n${text.slice(0, 2000)}`
      }),
    });

    const checkData = await checkResponse.json();
    const isLegal = checkData.result.trim().toLowerCase().startsWith("yes");

    if (!isLegal) {
      showAlert("❌ This doesn’t look like a legal document. Please upload a valid legal file.", "error");
      resetAnalysisUI();
      return;
    }

    // Step 2: Proceed with full analysis
    const response = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        mode:'a'
       }),
    });

    if (!response.ok) {
      throw new Error("Analysis request failed");
    }

    const data = await response.json();
    saveAndRedirect(data.result, targetPage);

  } catch (err) {
    console.error("Analysis error:", err);
    showAlert("Error analyzing document. Please try again.", "error");
    resetAnalysisUI();
  }
}

function saveAndRedirect(summaryResult, targetPage) {
  // ✅ Save metadata and summary
  localStorage.setItem("docSummary", summaryResult);
  localStorage.setItem("docName", selectedFile.name);
  localStorage.setItem("docSize", `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`);
  localStorage.setItem("docText", extractedText);

  // ✅ Save original file (Base64)
  const reader = new FileReader();
  reader.onload = function (e) {
    localStorage.setItem("docFile", e.target.result); // base64 Data URL
    window.location.href = targetPage; // redirect based on button
  };
  reader.readAsDataURL(selectedFile);
}

// Extract text
async function extractText(file) {
  const ext = getFileExtension(file.name);
  if (ext === "txt") return await file.text();
  if (ext === "pdf") return await extractPdfText(file);
  return `Uploaded file (${ext}) not supported for text extraction.`;
}

// PDF extraction using global pdfjsLib
async function extractPdfText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async function () {
      try {
        const pdfData = new Uint8Array(reader.result);
        const pdf = await window["pdfjsLib"].getDocument({ data: pdfData }).promise;

        let textContent = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const text = await page.getTextContent();
          textContent += text.items.map((s) => s.str).join(" ") + "\n";
        }
        resolve(textContent);
      } catch (err) {
        console.error("PDF extraction error:", err);
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// UI Helpers
function startAnalysis() {
  progressBar.style.display = "block";
  quickSummaryBtn.disabled = true;
  botSummaryBtn.disabled = true;

  let progress = 0;
  const progressInterval = setInterval(() => {
    progress += Math.random() * 15;
    if (progress > 90) progress = 90;
    progressFill.style.width = progress + "%";
  }, 200);

  quickSummaryBtn._progressInterval = progressInterval;
}

function resetAnalysisUI() {
  quickSummaryBtn.disabled = false;
  botSummaryBtn.disabled = false;
  progressBar.style.display = "none";
  progressFill.style.width = "0%";

  if (quickSummaryBtn._progressInterval) {
    clearInterval(quickSummaryBtn._progressInterval);
    quickSummaryBtn._progressInterval = null;
  }
}

function showAlert(message, type = "info") {
  const alertDiv = document.createElement("div");
  alertDiv.className = `custom-alert alert-${type}`;
  alertDiv.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === "error" ? "#ef4444" : type === "warning" ? "#f59e0b" : "#3b82f6"};
      color: white;
      padding: 15px 20px;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      z-index: 1000;
      font-weight: 600;
      animation: slideInRight 0.3s ease;
      max-width: 300px;
    ">
      ${message}
    </div>
  `;
  document.body.appendChild(alertDiv);

  if (!document.querySelector("#alert-styles")) {
    const style = document.createElement("style");
    style.id = "alert-styles";
    style.textContent = `
      @keyframes slideInRight {
        from { opacity: 0; transform: translateX(100%); }
        to { opacity: 1; transform: translateX(0); }
      }
    `;
    document.head.appendChild(style);
  }

  setTimeout(() => {
    if (alertDiv.parentNode) {
      alertDiv.style.opacity = "0";
      alertDiv.style.transform = "translateX(100%)";
      setTimeout(() => {
        document.body.removeChild(alertDiv);
      }, 300);
    }
  }, 4000);
}

// Features hover
function addFeatureInteractions() {
  document.querySelectorAll(".feature").forEach((f) => {
    f.addEventListener("mouseenter", () => {
      f.style.background = "rgba(79,70,229,0.1)";
      f.style.transform = "translateY(-2px)";
    });
    f.addEventListener("mouseleave", () => {
      f.style.background = "rgba(79,70,229,0.05)";
      f.style.transform = "translateY(0)";
    });
  });
}

// Utils
function getFileExtension(filename) {
  return filename.split(".").pop().toLowerCase();
}

function resetForm() {
  selectedFile = null;
  extractedText = "";
  fileInput.value = "";
  fileInfo.style.display = "none";
  resetUploadArea();
  resetAnalysisUI();
}

// Global API
window.LegalEaseAI = { resetForm, analyzeDocument, validateFile };