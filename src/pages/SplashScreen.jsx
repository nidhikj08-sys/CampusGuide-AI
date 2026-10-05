import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SplashScreen() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState("campus");
  const [showLogo, setShowLogo] = useState(false);
  const [showCollege, setShowCollege] = useState(false);
  const [showDept, setShowDept] = useState(false);
  const [showTitle, setShowTitle] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowLogo(true), 400);
    const t2 = setTimeout(() => { setShowLogo(false); setShowCollege(true); }, 1400);
    const t3 = setTimeout(() => { setShowCollege(false); setShowDept(true); }, 2000);
    const t4 = setTimeout(() => { setShowDept(false); setShowTitle(true); }, 2400);
    const t5 = setTimeout(() => navigate("/onboarding", { replace: true }), 4200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); };
  }, [navigate]);

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
