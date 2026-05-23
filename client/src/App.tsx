import { Navigate, Route, Routes } from 'react-router-dom';
import Landing from './pages/Landing';
import Connect from './pages/Connect';
import AppPage from './pages/AppPage';
import Bullets from './pages/Bullets';
import DashboardLayout from './components/dashboard/DashboardLayout';
import Dashboard from './pages/Dashboard';
import DashboardVersions from './pages/DashboardVersions';
import DashboardVersionDetail from './pages/DashboardVersionDetail';
import DashboardAnalytics from './pages/DashboardAnalytics';
import SharePost from './pages/SharePost';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/connect" element={<Connect />} />
      <Route path="/app" element={<AppPage />} />
      <Route path="/analyze" element={<Navigate to="/app" replace />} />
      <Route path="/bullets" element={<Bullets />} />
      <Route path="/post/:code" element={<SharePost />} />
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="versions" element={<DashboardVersions />} />
        <Route path="versions/:id" element={<DashboardVersionDetail />} />
        <Route path="analytics" element={<DashboardAnalytics />} />
      </Route>
    </Routes>
  );
}
