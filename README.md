# AI-Powered Research Assistant  
An AI-powered research assistant for discovering, comparing, and visualizing insights from scholarly articles.

---

## 🚀 Table of Contents  
- [Motivation](#motivation)  
- [Features](#features)  
- [Tech Stack](#tech-stack)  
- [Getting Started](#getting-started)  
  - [Prerequisites](#prerequisites)  
  - [Installation & Setup](#installation-and-setup)  
  - [Running Locally](#running-locally)  
- [Usage](#usage)  
- [Project Structure](#project-structure)  
- [How It Works](#how-it-works)  
- [Contributing](#contributing)  
- [License](#license)  
- [Acknowledgements](#acknowledgements)  

---

## Motivation  
In the fast-moving world of research, keeping up with scholarly articles, extracting key insights, comparing findings, and visualising trends can be cumbersome.  
This project aims to simplify that by providing an assistant which:  
- helps discover relevant papers,  
- compares methodologies and results,  
- visualises insights in an intuitive way,  
- supports interactive exploration.  

---

## Features  
- 🎯 Search for scholarly articles via keywords/topics.  
- 📊 Compare different papers on metrics, methods, results.  
- 📈 Visualise insight trends (e.g., publication timeline, methods vs outcomes).  
- 🧠 Leverage AI/LLM (e.g., via Gemini or other APIs) for summarisation, insights extraction.  
- 🖥️ Web-based UI (built with modern frontend tooling) for interactive use.

---

## Tech Stack  
- Frontend: TypeScript, HTML, Vite (or similar)  
- Backend (if applicable): Node.js (or your chosen stack)  
- AI/ML: Integration with LLM API (Gemini API key)  
- Visualization: Charting libraries (e.g., Chart.js, D3.js)  
- Others: Environment variables, configuration via `.env`  
- The repository shows major pieces: `App.tsx`, `index.tsx`, `types.ts`, etc. {Source of files list} :contentReference[oaicite:2]{index=2}

---

## Getting Started  

### Prerequisites  
- Node.js (recommend v14+ or current LTS)  
- NPM or Yarn package manager  
- An API key for the LLM (e.g., Gemini) — you’ll need to set it as an environment variable.

### Installation & Setup  
1. Clone the repository:  
   ```bash  
   git clone https://github.com/dharun-anandhan/AI-Powererd-Research-Assistasnt.git  
   cd AI-Powererd-Research-Assistasnt  
2. Install dependencies:

npm install  


3. Create an .env.local (or .env) file and set your API key:

    GEMINI_API_KEY=your_api_key_here


{Repository instruction says: “Set the GEMINI_API_KEY in .env.local to your Gemini API key”} 
GitHub

Running Locally
npm run dev  
