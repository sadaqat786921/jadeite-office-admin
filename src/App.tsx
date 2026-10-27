import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/Layout';
import Dashboard from './pages/Dashboard';
import { Login, Welcome } from './pages/Auth';
import { Enquiries } from './pages/Enquiries';
import EnquiryDetail from './pages/EnquiryRecord';
import Pipeline from './pages/Pipeline';
import Appointments from './pages/Appointments';
import { Customers, CustomerDetail } from './pages/Customers';
import Quotes from './pages/Quotes';
import { Jobs } from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import Surveys from './pages/Surveys';
import { Orders, Deliveries } from './pages/Supply';
import { Installations, Diary, InstallerDiary } from './pages/Installs';
import { Snags, Aftercare } from './pages/Aftercare';
import Messages from './pages/Messages';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/welcome/:step" element={<Welcome />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/enquiries" element={<Enquiries />} />
        <Route path="/enquiries/:id" element={<EnquiryDetail />} />
        <Route path="/pipeline" element={<Pipeline />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/customers/:id" element={<CustomerDetail />} />
        <Route path="/quotes" element={<Quotes />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/:id" element={<JobDetail />} />
        <Route path="/surveys" element={<Surveys />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/deliveries" element={<Deliveries />} />
        <Route path="/installations" element={<Installations />} />
        <Route path="/diary" element={<Diary />} />
        <Route path="/diary/installer/:id" element={<InstallerDiary />} />
        <Route path="/snags" element={<Snags />} />
        <Route path="/aftercare" element={<Aftercare />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/portal" element={<Navigate to="/" replace />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
