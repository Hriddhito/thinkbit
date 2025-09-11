// 🌐 Replace this with your Render backend URL
const BACKEND_URL = "https://thinkbit-h81d.onrender.com/analyze";

// DOM Elements
const fileInput = document.getElementById("file-input");
const fileInfo = document.getElementById("file-info");
const fileName = document.getElementById("file-name");
const fileSize = document.getElementById("file-size");
const uploadArea = document.getElementById("upload-area");
const analyzeBtn = document.getElementById("analyze-btn");
const chooseFileBtn = document.getElementById("choose-file-btn");
const progressBar = document.getElementById("progress-bar");
const progressFill = document.getElementById("progress-fill");

// Global variables
let selectedFile = null;

// Event listeners
document.addEventListener("DOMContentLoaded", () => {
  // Wake up backend server to reduce cold start delay
  if (BACKEND_URL) {
    fetch(BACKEND_URL, { method: "HEAD" })
      .then(() => console.log("Backend wake-up ping sent"))
      .catch(() => console.log("Backend wake-up ping failed"));
  }
  initializeApp();
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
    <div class="upload-subtext">Click "Analyze Document" to continue</div>
  `;
}

function resetUploadArea() {
  uploadArea.innerHTML = `
    <span class="upload-icon">📄</span>
    <div class="upload-text">Drop your legal document here</div>
    <div class="upload-subtext">or click to browse • Supports PDF, DOC, DOCX, TXT • Max 10MB</div>
  `;
}

// Drag/drop
function handleDragOver(e) { e.preventDefault(); uploadArea.classList.add("dragover"); }
function handleDragLeave(e) { e.preventDefault(); uploadArea.classList.remove("dragover"); }
function handleDrop(e) {
  e.preventDefault();
  uploadArea.classList.remove("dragover");
  const files = e.dataTransfer.files;
  if (files.length > 0) { fileInput.files = files; handleFileSelect(); }
}

// Analyze document
async function analyzeDocument() {
  if (!selectedFile) {
    showAlert("Please select a document first!", "warning");
    return;
  }

  startAnalysis();

  try {
    const text = await extractText(selectedFile);

    const response = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    const data = await response.json();

    // ✅ Save data in localStorage for summary.html
    localStorage.setItem("docSummary", data.result);
    localStorage.setItem("docName", selectedFile ? selectedFile.name : "Legal Document");
    localStorage.setItem("docSize", selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : "Unknown size");

    // Redirect to summary page
    window.location.href = "summary.html";
  } catch (err) {
    console.error(err);
    showAlert("Error analyzing document", "error");
  }

  resetAnalysisUI();
}

// Extract text
async function extractText(file) {
  const ext = getFileExtension(file.name);
  if (ext === "txt") return await file.text();
  if (ext === "pdf") return await extractPdfText(file);
  return `Uploaded file (${ext}) not supported for text extraction.`;
}

// ✅ PDF extraction (using pdfjsLib global script in index.html)
async function extractPdfText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async function () {
      try {
        const pdfData = new Uint8Array(reader.result);
        const pdf = await window['pdfjsLib'].getDocument({ data: pdfData }).promise;

        let textContent = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const text = await page.getTextContent();
          textContent += text.items.map(s => s.str).join(" ") + "\n";
        }
        resolve(textContent);
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// UI Helpers
function startAnalysis() {
  progressBar.style.display = "block";
  analyzeBtn.disabled = true;
  analyzeBtn.innerHTML = "🔄 Processing...";
}
function resetAnalysisUI() {
  analyzeBtn.disabled = false;
  analyzeBtn.innerHTML = "🤖 Analyze Document";
  progressBar.style.display = "none";
  progressFill.style.width = "0%";
}
function showAlert(message) { alert(message); }

// Features hover
function addFeatureInteractions() {
  document.querySelectorAll(".feature").forEach(f => {
    f.addEventListener("mouseenter", () => f.style.background = "rgba(79,70,229,0.1)");
    f.addEventListener("mouseleave", () => f.style.background = "rgba(79,70,229,0.05)");
  });
}

// Utils
function getFileExtension(filename) {
  return filename.split(".").pop().toLowerCase();
}

function resetForm() {
  selectedFile = null;
  fileInput.value = "";
  fileInfo.style.display = "none";
  resetUploadArea();
  resetAnalysisUI();
}

window.LegalEaseAI = { resetForm, analyzeDocument, validateFile };