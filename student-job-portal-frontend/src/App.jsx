import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";

import StudentDashboard from "./pages/student/StudentDashboard";
import JobList from "./pages/student/JobList";
import EditProfile from "./pages/student/EditProfile";

import EmployerDashboard from "./pages/employer/EmployerDashboard";
import JobPost from "./pages/employer/JobPost";
import EmployerApplications from "./pages/employer/EmployerApplications";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminJobs from "./pages/admin/AdminJobs";
import EmployerVerification from "./pages/admin/EmployerVerification";


import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";

import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";




export default function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Student */}
        <Route
          path="/student"
          element={
            <ProtectedRoute role="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/jobs"
          element={
            <ProtectedRoute role="student">
              <JobList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/profile"
          element={
            <ProtectedRoute role="student">
              <EditProfile />
            </ProtectedRoute>
          }
        />

        {/* Employer */}
        <Route
          path="/employer"
          element={
            <ProtectedRoute role="employer">
              <EmployerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/employer/job-post"
          element={
            <ProtectedRoute role="employer">
              <JobPost />
            </ProtectedRoute>
          }
        />

        <Route
          path="/employer/applications"
          element={
            <ProtectedRoute role="employer">
              <EmployerApplications />
            </ProtectedRoute>
          }
        />

        {/* Admin */}
        <Route
  path="/admin"
  element={
    <ProtectedRoute role="admin"> 
        <h2>Admin Dashboard</h2>
    </ProtectedRoute>
  }
/>

        <Route
          path="/admin/jobs"
          element={
            <ProtectedRoute role="admin">
              <AdminJobs />
            </ProtectedRoute>
          }
        />
        <Route
        path="/admin/employers"
        element={
          <ProtectedRoute role="admin">
            <EmployerVerification />
          </ProtectedRoute>
        }
      />

      </Routes>
    </BrowserRouter>
  );
}
