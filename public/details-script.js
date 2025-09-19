document.addEventListener("DOMContentLoaded", async () => {
  let lastInputWasVoice = false; // flag for input mode

  // Load document data from localStorage
  const docName = localStorage.getItem("docName") || "Unknown Document";
  const docSize = localStorage.getItem("docSize") || "Unknown Size";
  const summary = localStorage.getItem("docSummary") || "";
  const docText = localStorage.getItem("docText") || "";
  const docFile = localStorage.getItem("docFile");

  // Update header
  document.getElementById("doc-title").textContent = docName;
  document.getElementById("doc-meta").textContent = `${docSize} • Processed ${new Date().toLocaleString()}`;

  // Metadata
  const words = (docText || summary).split(/\s+/).filter(Boolean).length;
  document.getElementById("detail-type").textContent = detectDocType(summary || docText);
  document.getElementById("detail-words").textContent = words.toLocaleString();
  document.getElementById("detail-parties").textContent = detectParties(docText);
  document.getElementById("detail-jurisdiction").textContent = detectJurisdiction(docText);
  document.getElementById("detail-dates").textContent = detectDates(docText);

  // === PDF Viewer ===
  if (docFile && docFile.startsWith("data:application/pdf")) {
    try {
      const pdfData = atob(docFile.split(",")[1]);
      const bytes = new Uint8Array(pdfData.length);
      for (let i = 0; i < pdfData.length; i++) bytes[i] = pdfData.charCodeAt(i);

      const pdf = await window["pdfjsLib"].getDocument({ data: bytes }).promise;
      let currentPage = 1;
      const totalPages = pdf.numPages;

      const canvas = document.getElementById("pdf-canvas");
      const ctx = canvas.getContext("2d");
      const pageInfo = document.getElementById("page-info");
      const prevBtn = document.getElementById("prev-page");
      const nextBtn = document.getElementById("next-page");

      async function renderPage(num) {
        const page = await pdf.getPage(num);
        const containerWidth = document.querySelector(".pdf-viewer").clientWidth;
        const viewport = page.getViewport({ scale: 1 });
        const scale = containerWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale });

        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;
        pageInfo.textContent = `Page ${num} of ${totalPages}`;
      }

      prevBtn.addEventListener("click", () => { if (currentPage > 1) renderPage(--currentPage); });
      nextBtn.addEventListener("click", () => { if (currentPage < totalPages) renderPage(++currentPage); });

      renderPage(currentPage);
      document.getElementById("detail-pages").textContent = totalPages;
    } catch (err) {
      console.error("PDF render failed:", err);
      document.getElementById("preview-fallback").style.display = "block";
    }
  }

  // === Chatbot ===
  const chatInput = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-btn");
  const micBtn = document.getElementById("mic-btn");
  const messagesDiv = document.getElementById("messages");

  function addMessage(text, sender) {
    const msg = document.createElement("div");
    msg.className = `message ${sender}`;
    msg.textContent = text;
    messagesDiv.appendChild(msg);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    // Only speak if last input was voice
    if (sender === "bot" && lastInputWasVoice) speakText(text);
  }

  async function sendMessage() {
    const userMessage = chatInput.value.trim();
    if (!userMessage) return;

    addMessage(userMessage, "user");
    chatInput.value = "";

    try {
      const response = await fetch("/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: `Document context:\n${docText || summary}\n\nUser question: ${userMessage}` }),
      });
      const data = await response.json();
      addMessage(data.result || "Sorry, I couldn’t answer that.", "bot");
    } catch (error) {
      console.error(error);
      addMessage("⚠️ Error connecting to AI service.", "bot");
    }

    // reset flag after each exchange
    lastInputWasVoice = false;
  }

  sendBtn.addEventListener("click", () => {
    lastInputWasVoice = false; // typed input
    sendMessage();
  });
  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      lastInputWasVoice = false; // typed input
      sendMessage();
    }
  });

  // === Text-to-Speech ===
  function speakText(text) {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      speechSynthesis.speak(utterance);
    }
  }

  // === Speech-to-Text ===
  if ("webkitSpeechRecognition" in window) {
    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    micBtn.addEventListener("click", () => {
      recognition.start();
      micBtn.classList.add("listening");
      micBtn.innerHTML = `<i class="fas fa-stop"></i>`;
    });

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      chatInput.value = transcript;

      // mark input as voice before sending
      lastInputWasVoice = true;
      sendMessage();

      micBtn.classList.remove("listening");
      micBtn.innerHTML = `<i class="fas fa-microphone"></i>`;
    };

    recognition.onerror = () => {
      micBtn.classList.remove("listening");
      micBtn.innerHTML = `<i class="fas fa-microphone"></i>`;
    };
    recognition.onend = () => {
      micBtn.classList.remove("listening");
      micBtn.innerHTML = `<i class="fas fa-microphone"></i>`;
    };
  }
});

// === Helper functions ===
function detectDocType(text) {
  const t = text.toLowerCase();
  if (t.includes("lease")) return "Lease Agreement";
  if (t.includes("contract") || t.includes("agreement")) return "Contract / Agreement";
  if (t.includes("policy")) return "Policy Document";
  if (t.includes("will")) return "Legal Will";
  return "Legal Document";
}
function detectParties(text) {
  const match = text.match(/between\s+(.+?)\s+and\s+(.+?)[.,]/i);
  return match ? `${match[1]} & ${match[2]}` : "Not detected";
}
function detectJurisdiction(text) {
  const match = text.match(/laws of\s+([A-Za-z\s]+)/i);
  return match ? match[1].trim() : "Not detected";
}
function detectDates(text) {
  const matches = text.match(/\b(?:\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\b\s+\d{1,2},?\s+\d{4})/gi);
  return matches ? matches.join(", ") : "Not detected";
}
