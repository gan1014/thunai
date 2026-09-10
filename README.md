# 🌟 THUNAI (SAHAY-X): Situation-Aware Multimodal Accessibility AI

> **"Technology that understands you"** — A production-grade, real-time multimodal assistive framework empowering visually and speech-impaired individuals with spatial vision, voice-first interaction, 21-point kinematic hand gesture recognition, and zero-reload multilingual intelligence.

---

## 🚀 Key Highlights & Architecture

- **🌐 Zero-Reload Multilingual i18n Engine**:
  - Instant client-side switching across **English (`en`)**, **தமிழ் / Tamil (`ta`)**, **తెలుగు / Telugu (`te`)**, and **हिन्दी / Hindi (`hi`)**.
  - Persistent user preference synced with persona profiles and `localStorage`.
  - Single Source of Truth governing UI strings, dynamic STT BCP-47 mapping (`en-IN`, `ta-IN`, `te-IN`, `hi-IN`), LLM system prompts, and Web Speech synthesis.

- **👁️ Spatial Vision & Google Maps AR Walking Corridor**:
  - Real-time doorway navigation, exit sign detection, and corridor hazard perception.
  - Directional clock-heading and stride estimation with voice feedback.

- **🎙️ Voice-First Interaction**:
  - Continuous speech recognition with intelligent barge-in interruption.
  - Multi-provider LLM pipeline with OpenRouter / Gemini and Edge AI fallback.

- **🖐️ Kinematic Gesture Control & ISL Recognition**:
  - 21-point hand landmark tracking via MediaPipe.
  - Real-time recognition of Closed-Fist (SOS), Wave (Greeting/Help), Pointing Up (Exit Wayfinding), Thumbs Up/Down, and Peace sign.

- **🚨 Emergency SOS Distress Dispatch**:
  - Single-touch and closed-fist emergency broadcast with live GPS telemetry.
  - Automated Twilio SMS and WhatsApp notifications to designated caregivers.

- **📄 Smart OCR & Medicine Dosage Verification**:
  - Structured medication strip reading, dosage instructions, and signage translation.

- **📊 AAS Scientific Benchmarking & Live Telemetry**:
  - Quantitative telemetry tracking Adaptive Accessibility Score (AAS), task completion rate, and sub-second latencies.

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or bun

### 1. Installation
```bash
git clone https://github.com/gan1014/thunai.git
cd thunai
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in the following keys:
```env
PORT=4000
GEMINI_API_KEY=your_gemini_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_VISION_MODEL=google/gemma-4-26b-a4b-it:free
OPENROUTER_TEXT_MODEL=google/gemma-4-26b-a4b-it:free
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
EMERGENCY_CONTACT_PHONE=+918939517847
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:4000](http://localhost:4000) in your browser.

### 4. Run Test Suite
```bash
npm test
```

### 5. Production Build
```bash
npm run build
```

---

## 📜 License & Compliance
- Compliant with **WCAG 2.1 AAA / ISO/IEC 40500** accessibility guidelines.
- Built for real-world impact and high-contrast usability.
