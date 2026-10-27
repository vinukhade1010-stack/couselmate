import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { errorMessage } from '../api.js';

/** Shared by the heart on cards and the save button on the detail page. */
export default function useShortlist(collegeId) {
  const { user, shortlistIds, toggleShortlist } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const [pop, setPop] = useState(false);
  const saved = shortlistIds.includes(String(collegeId));

  async function toggle() {
    if (!user) {
      toast('Log in to save colleges to your shortlist.');
      navigate('/login', { state: { from: location.pathname + location.search } });
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      const now = await toggleShortlist(collegeId);
      setPop(true);
      setTimeout(() => setPop(false), 450);
      toast(now ? 'Saved to your shortlist.' : 'Removed from your shortlist.');
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  }
  return { saved, busy, pop, toggle };
}
