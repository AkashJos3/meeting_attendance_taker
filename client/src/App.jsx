import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import AttendeeView from './pages/AttendeeView';

function App() {
    return (
        <Router>
            <div className="min-h-screen">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/admin/:id" element={<AdminDashboard />} />
                    <Route path="/join/:id" element={<AttendeeView />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
