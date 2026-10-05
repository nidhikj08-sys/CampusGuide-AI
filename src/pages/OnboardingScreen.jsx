import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const SLIDES = [
  {
    id: "find",
    title: "Find Any Classroom",
    desc: "Indoor map of the 3-floor building — tap a room and get directions instantly.",
    icon: "🗺️",
  },
  {
    id: "timetable",
    title: "Know Your Timetable",
    desc: "Class, section, and room at a glance — never miss a lecture.",
    icon: "📅",
  },
  {
    id: "alerts",
    title: "Instant Alerts",
    desc: "Get notified immediately when a classroom is shifted or updated.",
    icon: "🔔",
  },
  {
    id: "ai",
    title: "Ask CampusGuide AI",
    desc: "Your AI assistant for campus doubts, room locations, and schedules.",
    icon: "🤖",
  },
];

export default function OnboardingScreen() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);

  const goNext = useCallback(() => {
    setIndex((prev) => {
      if (prev >= SLIDES.length - 1) {
        setTimeout(() => navigate("/login", { replace: true }), 250);
        return prev;
      }
      return prev + 1;
    });
  }, [navigate]);

  useEffect(() => {
    if (index >= SLIDES.length - 1) return;
    const timer = setInterval(goNext, 3000);
    return () => clearInterval(timer);
  }, [index, goNext]);

  function handleSkip() {
    navigate("/login", { replace: true });
  }

  const slide = SLIDES[index];

  return (
    <div className="onboarding-screen">
      <div className="onboarding-bg" />

      <button className="onboarding-skip" onClick={handleSkip}>
        Skip
      </button>

      <div className="onboarding-slides">
        {SLIDES.map((s, i) => (
          <div
            key={s.id}
            className={`onboarding-slide ${i === index ? "active" : ""}`}
          >
            <span className="onboarding-slide-icon">{s.icon}</span>
            <h2 className="onboarding-slide-title">{s.title}</h2>
            <p className="onboarding-slide-desc">{s.desc}</p>
          </div>
        ))}
      </div>

      <div className="onboarding-dots">
        {SLIDES.map((_, i) => (
          <span
            key={i}
            className={`onboarding-dot ${i === index ? "active" : ""}`}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>

      <div className="onboarding-footer">
        <button className="btn btn-primary onboarding-get-started" onClick={goNext}>
          {index === SLIDES.length - 1 ? "Get Started" : "Next"}
        </button>
      </div>
    </div>
  );
}
