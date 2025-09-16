# thinkbit
# ⚖️ LegalEase AI

LegalEase AI is a web app that helps simplify and analyze **legal documents** using **Google Gemini AI**.  
Upload a contract, agreement, or any legal PDF/DOC/TXT, and the app will generate a **summary** and allow you to **chat with an AI-powered legal assistant**.

---

## ✨ Features
- 📄 Upload **PDF, DOC, DOCX, or TXT** (max 10 MB).
- 🤖 **Quick Summary** – Get an AI-generated executive summary of the document.
- 💬 **Bot Assistant** – Chat with the AI about specific details inside your document.
- 🔍 **Detailed Analysis** – Extracts metadata like page count, parties, and key terms.
- 🎨 Modern responsive UI with animations (built in **HTML, CSS, JS**).
- 🔐 Secure – No documents are stored on servers.

---

## 🛠️ Tech Stack
- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **AI Model**: Google Gemini API (`@google/generative-ai`)
- **Backend**: Node.js + Express (hosted on Render)
- **Hosting**: Firebase Hosting (Frontend) + Render (Backend)

---

## 📂 Project Structure
LegalEase-AI/
│
├── public/ # Frontend files (served by Firebase)
│ ├── home.html # Landing page
│ ├── index.html # Upload & analysis page
│ ├── summary.html # Summary results page
│ ├── details.html # Detailed analysis + chatbot
│ ├── styles.css # Main styles
│ ├── summary-styles.css # Summary page styles
│ ├── details-styles.css # Details page styles
│ ├── home-styles.css # Homepage styles
│ ├── script.js # Upload + analysis logic
│ ├── summary-script.js # Summary page logic
│ ├── details-script.js # Detailed analysis + chatbot logic
│ └── home-script.js # Homepage interactivity
│
├── server.js # Express backend (Render)
├── package.json # Node.js dependencies
├── firebase.json # Firebase Hosting config
└── README.md # Project documentation
