import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PowerReadings from './components/PowerReadings.jsx';
import LoginPage from './Page/LoginPage.jsx';
import SignupPage from './page/SignupPage.jsx';
import MainContent from './page/MainContent.jsx';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/power-readings" element={<PowerReadings />} />
        <Route path="/dashboard" element={<MainContent />} />
      </Routes>
    </Router>
  );
}

export default App;