import { Navigate, Route, Routes } from 'react-router-dom';
import Landing from './pages/Landing';
import AppPage from './pages/AppPage';
import Bullets from './pages/Bullets';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/app" element={<AppPage />} />
      <Route path="/analyze" element={<Navigate to="/app" replace />} />
      <Route path="/bullets" element={<Bullets />} />
    </Routes>
  );
}
