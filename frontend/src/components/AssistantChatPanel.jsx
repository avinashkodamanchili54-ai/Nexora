import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { LANGUAGES } from "../constants";
import {
  playRegionalSpeech,
  sendAssistantMessage,
  stopRegionalSpeech,
  transcribeVoiceBlob,
} from "../api";

export default function AssistantChatPanel({
  farmProfile,
  latestDiagnosis,
  initialLang,
}) {
  const [chatLang, setChatLang] = useState(initialLang || "te");

  useEffect(() => {
    if (initialLang) {
      setChatLang(initialLang);
    }
  }, [initialLang]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [providerLabel, setProviderLabel] = useState("Gemini Free Tier");
  const mediaRecorderRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: `Namaste **${farmProfile.name}**! Ask me anything about your **${farmProfile.crop}** (${farmProfile.growth_stage}) in ${farmProfile.location}.`,
    },
  ]);
  const [suggestions, setSuggestions] = useState([
    "Should I spray fungicide today?",
    "How does today's weather affect my crop?",
    "Can I apply urea right now?",
  ]);

  const handleVoiceInput = async () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      const rec = new SpeechRec();
      const l = LANGUAGES.find((item) => item.code === chatLang);
      rec.lang = l ? l.speechLang : "en-IN";
      rec.onresult = (evt) => {
        const spoken = evt.results?.[0]?.[0]?.transcript;
        if (spoken) handleSend(spoken);
      };
      rec.start();
      return;
    }

    if (recording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const chunks = [];
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunks, { type: "audio/webm" });
      const res = await transcribeVoiceBlob(blob, chatLang).catch(() => null);
      if (res?.transcript) handleSend(res.transcript);
    };
    mediaRecorderRef.current = recorder;
    recorder.start();
    setRecording(true);
  };

  const handleSend = async (customText) => {
    const msgText = (customText ?? input).trim();
    if (!msgText) return;
    setMessages((prev) => [...prev, { role: "user", text: msgText }]);
    if (!customText) setInput("");
    setLoading(true);
    try {
      const res = await sendAssistantMessage({
        message: msgText,
        language: chatLang,
        farmer_name: farmProfile.name,
        crop: farmProfile.crop,
        growth_stage: farmProfile.growth_stage,
        location: farmProfile.location,
        latest_diagnosis: latestDiagnosis,
      });
      setProviderLabel(res.provider === "gemini-free-tier" ? "Gemini LLM" : "Local Fallback");
      setMessages((prev) => [...prev, { role: "assistant", text: res.reply }]);
      setSuggestions(res.suggested_questions || []);
      playRegionalSpeech(res.reply, chatLang);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel-card">
      <div className="section-head">
        <div>
          <h2>Krishi Sakhi Multilingual Voice &amp; Chat Assistant</h2>
          <p className="muted">
            Engine: <strong>{providerLabel}</strong> · {farmProfile.crop} ({farmProfile.growth_stage})
          </p>
        </div>

        <div className="field">
          <label htmlFor="chat-lang">Conversation Language</label>
          <select
            id="chat-lang"
            value={chatLang}
            onChange={(e) => {
              stopRegionalSpeech();
              setChatLang(e.target.value);
            }}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="chat-window">
        {messages.map((m, idx) => (
          <div key={idx} className={`chat-bubble ${m.role}`}>
            <span className="chat-sender">
              {m.role === "assistant" ? "Krishi Sakhi AI" : farmProfile.name}
            </span>
            <div className="chat-markdown">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown>
            </div>
            {m.role === "assistant" ? (
              <button
                type="button"
                className="mini-audio-btn"
                onClick={() => playRegionalSpeech(m.text, chatLang)}
              >
                Play Neural Voice
              </button>
            ) : null}
          </div>
        ))}
        {loading ? (
          <div className="chat-bubble assistant typing-bubble">
            <span className="chat-sender">Krishi Sakhi AI</span>
            <p className="chat-para">Thinking in your language...</p>
          </div>
        ) : null}
      </div>

      <div className="suggestion-row">
        {suggestions.map((s, idx) => (
          <button
            key={idx}
            type="button"
            className="chip-btn"
            onClick={() => handleSend(s)}
          >
            {s}
          </button>
        ))}
      </div>

      <form
        className="input-row"
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask in Telugu, Hindi, Tamil, Kannada, or English..."
        />
        <button
          type="button"
          className={`mic-icon-btn ${recording ? "recording" : ""}`}
          onClick={handleVoiceInput}
          aria-label={recording ? "Stop voice recording" : "Speak in selected language"}
          title={recording ? "Stop recording" : "Voice input (STT)"}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        </button>
        <button type="submit" className="primary-btn" disabled={loading}>
          {loading ? "..." : "Send"}
        </button>
      </form>
    </section>
  );
}
