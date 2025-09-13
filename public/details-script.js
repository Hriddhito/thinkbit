const BACKEND_URL = "https://thinkbit-h81d.onrender.com/analyze";

document.addEventListener("DOMContentLoaded", async () => {
  // Load document data from localStorage
  const docName = localStorage.getItem("docName") || "Unknown Document";
  const docSize = localStorage.getItem("docSize") || "Unknown Size";
  const summary = localStorage.getItem("docSummary") || "";
  const docText = localStorage.getItem("docText") || "";
  const docFile = localStorage.getItem("docFile"); // base64 Data URL

  // Update header
  document.getElementById("doc-title").textContent = docName;
  document.getElementById("doc-meta").textContent = `${docSize} • Processed ${new Date().toLocaleString()}`;

  // === Document Metadata ===
  const words = (docText || summary).split(/\s+/).filter(Boolean).length;

  document.getElementById("detail-type").textContent = detectDocType(summary || docText);
  document.getElementById("detail-words").textContent = words.toLocaleString();

  // Placeholder values – can improve later with AI
  document.getElementById("detail-parties").textContent = detectParties(docText);
  document.getElementById("detail-jurisdiction").textContent = detectJurisdiction(docText);
  document.getElementById("detail-dates").textContent = detectDates(docText);

  // === PDF Preview with Navigation ===
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

        // scale dynamically to container width
        const containerWidth = document.querySelector(".pdf-viewer").clientWidth;
        const viewport = page.getViewport({ scale: 1 });
        const scale = containerWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale });

        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        const renderContext = {
          canvasContext: ctx,
          viewport: scaledViewport,
        };

        await page.render(renderContext).promise;
        pageInfo.textContent = `Page ${num} of ${totalPages}`;
      }

      // Button actions
      prevBtn.addEventListener("click", () => {
        if (currentPage > 1) {
          currentPage--;
          renderPage(currentPage);
        }
      });

      nextBtn.addEventListener("click", () => {
        if (currentPage < totalPages) {
          currentPage++;
          renderPage(currentPage);
        }
      });

      // Initial render
      renderPage(currentPage);

      // Update page count in metadata
      document.getElementById("detail-pages").textContent = totalPages;

    } catch (err) {
      console.error("PDF render failed:", err);
      document.getElementById("preview-fallback").style.display = "block";
    }
  } else {
    document.getElementById("detail-pages").textContent = "—";
    document.getElementById("preview-fallback").style.display = "block";
  }

  // === Chatbot ===
  const chatInput = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-btn");
  const messagesDiv = document.getElementById("messages");

  function addMessage(text, sender) {
    const msg = document.createElement("div");
    msg.className = `message ${sender}`;
    msg.textContent = text;
    messagesDiv.appendChild(msg);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  async function sendMessage() {
    const userMessage = chatInput.value.trim();
    if (!userMessage) return;

    addMessage(userMessage, "user");
    chatInput.value = "";

    try {
      const response = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `Document context:\n${docText || summary}\n\nUser question: ${userMessage}`
        }),
      });

      const data = await response.json();
      addMessage(data.result || "Sorry, I couldn’t answer that.", "bot");
    } catch (error) {
      console.error(error);
      addMessage("⚠️ Error connecting to AI service.", "bot");
    }
  }

  sendBtn.addEventListener("click", sendMessage);
  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });
});

// === Helper functions ===
function detectDocType(text) {
  const t = text.toLowerCase();
  if (t.includes("lease")) return "Lease Agreement";
  if (t.includes("contract") || t.includes("agreement")) return "Contract / Agreement";
  if (t.includes("policy")) return "Policy Document";
  if (t.includes("testament") || t.includes("will")) return "Legal Will";
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
