// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainApp from './MainApp';
import AdminApp from './AdminApp';
import './styles.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainApp />} />
        
        {/* AdminApp ya maneja su propia lógica de login/panel */}
        <Route path="/admin" element={<AdminApp />} />
        

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;