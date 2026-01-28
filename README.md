# CHRONEX: Autonomous Ergonomic Architect

Chronex is a hyper-premium, AI-powered dashboard designed to optimize your workflow, posture, and cognitive state. Built with the "Appetite Studio" aesthetic in mind, it features a deep void theme, glassmorphism, and real-time AI integration.

## 🚀 Features

*   **Deep Void Aesthetic**: Immersive dark theme (`#030303`) with Electric Lime accents.
*   **AI Vision Monitor**: Real-time webcam analysis using `Gemini 1.5 Flash` to detecting posture and fatigue (simulated/active).
*   **AI Mindset Coach**: Voice-activated chat assistant powered by `Qwen 3 (32B)`, contextualized with your biometric data.
*   **Focus Engine**: Liquid-animated Pomodoro timer with "Focus" and "Break" modes.
*   **Performance Analytics**: Real-time data visualization of your cognitive load and posture scores.
*   **AI Taskbar**: Quick-access glass dock to external AI tools (Grok, Claude, Gemini).

## 🛠️ Tech Stack

*   **Framework**: React 18 + Vite
*   **Styling**: Tailwind CSS v4 (Native CSS variables)
*   **Animations**: Framer Motion
*   **AI Integration**: Hack Club AI Proxy (Gemini + Qwen)
*   **Icons**: Lucide React

## 📦 Setup & Run

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Start Development Server**:
    ```bash
    npm run dev
    ```
    *Note: The server includes a local proxy to bypass CORS for the AI API.*

## 🔑 Environment

The application uses a hardcoded API key for the Hack Club Proxy. If you need to change it, update `src/hooks/useGemini.js`.

## 🎨 Design System

*   **Background**: Infinite Black (`bg-chronex-bg`)
*   **Accent**: Electric Lime (`#ccff00`)
*   **Typography**: Inter (UI) + JetBrains Mono (Data/Tech)

---
*Built by Antigravity*
