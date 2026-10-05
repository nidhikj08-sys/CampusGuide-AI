import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const FIRST_LAUNCH_KEY = "campusguide_first_launch";

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

export default function Entry() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState("splash"); // splash | onboarding | done

  useEffect(() => {
    const seen = localStorage.getItem(FIRST_LAUNCH_KEY);
    if (seen) {
      setPhase("done");
      return;
    }
    const t = setTimeout(() => setPhase("onboarding"), 4200);
    return () => clearTimeout(t);
  }, []);

  if (phase === "done") {
    return <Navigate to="/login" replace />;
  }

  if (phase === "splash") {
    return <SplashWrapper onDone={() => setPhase("onboarding")} />;
  }

  return <OnboardingWrapper onDone={() => { localStorage.setItem(FIRST_LAUNCH_KEY, "true"); navigate("/login", { replace: true }); }} />;
}

function SplashWrapper({ onDone }) {
  const [showLogo, setShowLogo] = useState(false);
  const [showCollege, setShowCollege] = useState(false);
  const [showDept, setShowDept] = useState(false);
  const [showTitle, setShowTitle] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowLogo(true), 400);
    const t2 = setTimeout(() => { setShowLogo(false); setShowCollege(true); }, 1400);
    const t3 = setTimeout(() => { setShowCollege(false); setShowDept(true); }, 2000);
    const t4 = setTimeout(() => { setShowDept(false); setShowTitle(true); }, 2400);
    const t5 = setTimeout(onDone, 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); };
  }, [onDone]);

  return (
    <div className="splash-screen">
      <div className="splash-bg" />
      <div className="splash-overlay" />
      <div className="splash-content">
        {showLogo && (
          <div className="splash-logo-anim">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" className="splash-kvg-logo">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
        )}
        {showCollege && (
          <div className="splash-fade-in splash-college">
            <h1 className="splash-college-name">K.V.G. COLLEGE OF ENGINEERING, SULLIA</h1>
            <div className="splash-line" />
          </div>
        )}
        {showDept && (
          <div className="splash-fade-in splash-dept">
            <p className="splash-dept-text">Department of Computer Science & Engineering</p>
          </div>
        )}
        {showTitle && (
          <div className="splash-title-reveal">
            <h1 className="splash-app-title">CampusGuide AI</h1>
            <p className="splash-tagline">Find Your Way, Every Day</p>
          </div>
        )}
      </div>
    </div>
  );
}

function OnboardingWrapper({ onDone }) {
  const [index, setIndex] = useState(0);

  const goNext = useCallback(() => {
    setIndex((prev) => {
      if (prev >= SLIDES.length - 1) {
        setTimeout(onDone, 250);
        return prev;
      }
      return prev + 1;
    });
  }, [onDone]);

  useEffect(() => {
    if (index >= SLIDES.length - 1) return;
    const timer = setInterval(goNext, 3000);
    return () => clearInterval(timer);
  }, [index, goNext]);

  const slide = SLIDES[index];

  return (
    <div className="onboarding-screen">
      <div className="onboarding-bg" />
      <button className="onboarding-skip" onClick={onDone}>Skip</button>

      <div className="onboarding-slides">
        {SLIDES.map((s, i) => (
          <div key={s.id} className={`onboarding-slide ${i === index ? "active" : ""}`}>
            <span className="onboarding-slide-icon">{s.icon}</span>
            <h2 className="onboarding-slide-title">{s.title}</h2>
            <p className="onboarding-slide-desc">{s.desc}</p>
          </div>
        ))}
      </div>

      <div className="onboarding-dots">
        {SLIDES.map((_, i) => (
          <span key={i} className={`onboarding-dot ${i === index ? "active" : ""}`} onClick={() => setIndex(i)} />
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
