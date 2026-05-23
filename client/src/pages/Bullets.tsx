import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Bullets() {
  const navigate = useNavigate();

  useEffect(() => {
    console.log('[bullets] Redirecting to /app — bullets are now step 2 of the app flow');
    navigate('/app', { replace: true });
  }, [navigate]);

  return null;
}
