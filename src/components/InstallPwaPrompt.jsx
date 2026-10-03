import { useState, useEffect } from "react";

export default function InstallPwaPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  useEffect(() => {
    // Check if already in standalone / installed mode
    if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone) {
      setIsStandalone(true);
      return;
    }

    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  if (isStandalone) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowIOSPrompt(true);
    }
  };

  // Only render if we have a prompt available or if on iOS
  if (!deferredPrompt && !isIOS) return null;

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="pwa-install-btn"
        title="Install CampusGuide as an App"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          width: "calc(100% - 24px)",
          margin: "8px 12px",
          padding: "10px 14px",
          background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
          color: "#ffffff",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: 600,
          fontSize: "14px",
          boxShadow: "0 2px 8px rgba(37, 99, 235, 0.3)",
          transition: "transform 0.15s ease, background 0.2s ease",
        }}
      >
        <span style={{ fontSize: "16px" }}>📲</span>
        <span>Install App</span>
      </button>

      {/* iOS Manual instructions modal */}
      {showIOSPrompt && (
        <div
          onClick={() => setShowIOSPrompt(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#ffffff",
              color: "#1e293b",
              borderRadius: "12px",
              padding: "20px",
              maxWidth: "340px",
              textAlign: "center",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ margin: "0 0 10px 0", fontSize: "18px" }}>Install on iOS</h3>
            <p style={{ fontSize: "14px", lineHeight: "1.5", color: "#64748b", margin: "0 0 16px 0" }}>
              1. Tap the <strong>Share</strong> button in Safari's toolbar at the bottom.<br />
              2. Scroll down and tap <strong>"Add to Home Screen"</strong>.<br />
              3. Tap <strong>"Add"</strong> in the top right.
            </p>
            <button
              onClick={() => setShowIOSPrompt(false)}
              style={{
                width: "100%",
                padding: "8px 16px",
                background: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
