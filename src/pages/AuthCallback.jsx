import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../supabase";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const next = searchParams.get("next") || "/student";
      const error = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      if (error) {
        console.error("Auth callback error:", error, errorDescription);
        navigate(`/login?error=${encodeURIComponent(errorDescription || error)}`);
        return;
      }

      if (code) {
        try {
          const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
          if (sessionError) throw sessionError;
          
          // Get user to determine role
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("role")
              .eq("id", user.id)
              .maybeSingle();
            
            const redirectPath = profile?.role === "faculty" ? "/faculty" 
              : profile?.role === "admin" ? "/admin" 
              : "/student";
            
            navigate(redirectPath, { replace: true });
          } else {
            navigate(next, { replace: true });
          }
        } catch (err) {
          console.error("Session exchange failed:", err);
          navigate(`/login?error=${encodeURIComponent("Authentication failed. Please try again.")}`);
        }
      } else {
        // No code - might be a direct redirect from email confirmation
        navigate(next, { replace: true });
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="center-screen">
      <div className="card auth-card">
        <div className="loading-state">
          <div className="spinner" />
          <p>Completing sign in...</p>
        </div>
      </div>
    </div>
  );
}