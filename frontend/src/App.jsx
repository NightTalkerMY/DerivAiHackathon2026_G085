import { useState } from 'react'
import { Routes, Route, Navigate } from "react-router-dom";
import './index.css'
import { MainLayout } from "./components/layout";
import Curriculum from './pages/Curriculum'
import Dashboard from './pages/Dashboard';
import Achievements from './pages/Achievements';
import Settings from './pages/Settings';
import ModuleDetail from './pages/ModuleDetail';
import LessonDetail from './pages/LessonDetail';
import LiveTrade from './pages/LiveTrade';



function App() {
   return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/curriculum" element={<Curriculum />} />
        <Route path="/curriculum/:moduleId" element={<ModuleDetail />} />
        <Route path="/curriculum/:moduleId/:chapterName" element={<LessonDetail />} />
        <Route path="/live-trade" element={<LiveTrade />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App
