import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import { useEffect } from "react";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import FieldCapture from "./components/FieldCapture";
import PrivateGallery from "./pages/PrivateGallery";
import InteractiveMap from "./pages/InteractiveMap";
import ProtectedRoute from "./components/ProtectedRoute";
import { requestPersistentStorage } from "./lib/db";
import { syncEngine } from "./lib/syncEngine";

function App() {
  useEffect(() => {
    requestPersistentStorage();

    // Start background sync engine
    syncEngine.start();

    return () => {
      syncEngine.stop();
    };
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/field" element={<ProtectedRoute><FieldCapture /></ProtectedRoute>} />
        <Route path="/gallery" element={<ProtectedRoute><PrivateGallery /></ProtectedRoute>} />
        <Route path="/map" element={<ProtectedRoute><InteractiveMap /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
