import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import FieldCapture from "./components/FieldCapture";
import PrivateGallery from "./pages/PrivateGallery";
import InteractiveMap from "./pages/InteractiveMap";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/field" element={<FieldCapture />} />
        <Route path="/gallery" element={<PrivateGallery />} />
        <Route path="/map" element={<InteractiveMap />} />
      </Routes>
    </Router>
  );
}

export default App;
