import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Entry from "./pages/Entry";
import Login from "./pages/LoginScreen";
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
import AIChat from "./pages/AIChat";
import IndoorMap from "./pages/IndoorMap";
import BuildingMap from "./pages/BuildingMap";
import FindClassroom from "./pages/FindClassroom";
import Notifications from "./pages/Notifications";
import Events from "./pages/Events";
import ManageNotifications from "./pages/ManageNotifications";
import ManageEvents from "./pages/ManageEvents";
import RequestChange from "./pages/RequestChange";
import Profile from "./pages/Profile";

export default function App() {
  return (
    <Routes>
      {/* First-launch flow */}
      <Route path="/" element={<Entry />} />

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
       <Route path="/student/map" element={<ProtectedRoute allow={["student", "faculty", "admin"]}><BuildingMap /></ProtectedRoute>} />

       {/* Find Classroom */}
       <Route path="/map" element={<ProtectedRoute allow={["student", "faculty", "admin"]}><BuildingMap /></ProtectedRoute>} />
       <Route path="/find-classroom" element={<ProtectedRoute allow={["student", "faculty", "admin"]}><FindClassroom /></ProtectedRoute>} />
       <Route path="/notifications" element={<ProtectedRoute allow={["student", "faculty", "admin"]}><Notifications /></ProtectedRoute>} />
       <Route path="/events" element={<ProtectedRoute allow={["student", "faculty", "admin"]}><Events /></ProtectedRoute>} />

       {/* 5 & 6. Faculty Flow (Screens 5, 6) */}
      <Route path="/faculty" element={<ProtectedRoute allow={["faculty"]}><FacultyDashboard /></ProtectedRoute>} />
      <Route path="/faculty/timetable" element={<ProtectedRoute allow={["faculty"]}><Timetable /></ProtectedRoute>} />
      <Route path="/faculty/request-change" element={<ProtectedRoute allow={["faculty"]}><RequestChange /></ProtectedRoute>} />

      {/* 7 & 8. Admin Flow (Screens 7, 8) */}
      <Route path="/admin" element={<ProtectedRoute allow={["admin"]}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/classrooms" element={<ProtectedRoute allow={["admin"]}><ManageClassrooms /></ProtectedRoute>} />
       <Route path="/admin/timetable" element={<ProtectedRoute allow={["admin"]}><ManageTimetable /></ProtectedRoute>} />
       <Route path="/admin/notifications" element={<ProtectedRoute allow={["admin"]}><ManageNotifications /></ProtectedRoute>} />
       <Route path="/admin/events" element={<ProtectedRoute allow={["admin"]}><ManageEvents /></ProtectedRoute>} />
       <Route path="/admin/locations" element={<ProtectedRoute allow={["admin"]}><ManageLocations /></ProtectedRoute>} />

      {/* Shared Profile */}
      <Route path="/profile" element={<ProtectedRoute allow={["student", "faculty", "admin"]}><Profile /></ProtectedRoute>} />

      {/* Shared AI Assistant */}
      <Route path="/chat" element={<ProtectedRoute allow={["student", "faculty", "admin"]}><AIChat /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
