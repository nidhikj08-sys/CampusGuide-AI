import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import AuthCallback from "./pages/AuthCallback";
import StudentDashboard from "./pages/StudentDashboard";
import FacultyDashboard from "./pages/FacultyDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ManageClassrooms from "./pages/ManageClassrooms";
import ManageLocations from "./pages/ManageLocations";
import ManageTimetable from "./pages/ManageTimetable";
import Timetable from "./pages/Timetable";
import IndoorMap from "./pages/IndoorMap";
import RequestChange from "./pages/RequestChange";
import Profile from "./pages/Profile";

export default function App() {
  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* 2 & 3 & 4. Student Flow (Screens 2, 3, 4) */}
      <Route path="/student" element={<ProtectedRoute allow={["student"]}><StudentDashboard /></ProtectedRoute>} />
      <Route path="/student/timetable" element={<ProtectedRoute allow={["student", "faculty"]}><Timetable /></ProtectedRoute>} />
      <Route path="/student/map" element={<ProtectedRoute allow={["student", "faculty", "admin"]}><IndoorMap /></ProtectedRoute>} />

      {/* 5 & 6. Faculty Flow (Screens 5, 6) */}
      <Route path="/faculty" element={<ProtectedRoute allow={["faculty"]}><FacultyDashboard /></ProtectedRoute>} />
      <Route path="/faculty/timetable" element={<ProtectedRoute allow={["faculty"]}><Timetable /></ProtectedRoute>} />
      <Route path="/faculty/request-change" element={<ProtectedRoute allow={["faculty"]}><RequestChange /></ProtectedRoute>} />

      {/* 7 & 8. Admin Flow (Screens 7, 8) */}
      <Route path="/admin" element={<ProtectedRoute allow={["admin"]}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/classrooms" element={<ProtectedRoute allow={["admin"]}><ManageClassrooms /></ProtectedRoute>} />
      <Route path="/admin/timetable" element={<ProtectedRoute allow={["admin"]}><ManageTimetable /></ProtectedRoute>} />
      <Route path="/admin/locations" element={<ProtectedRoute allow={["admin"]}><ManageLocations /></ProtectedRoute>} />

      {/* Shared Profile */}
      <Route path="/profile" element={<ProtectedRoute allow={["student", "faculty", "admin"]}><Profile /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
