import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shortlistIds, setShortlistIds] = useState([]);

  const applyUser = useCallback((u) => {
    setUser(u);
    setShortlistIds(u ? (u.shortlist || []).map(String) : []);
  }, []);

  // On page load, ask the server who we are (the cookie tells it).
  useEffect(() => {
    api.get('/auth/me')
      .then((r) => applyUser(r.data.user))
      .catch(() => applyUser(null))
      .finally(() => setLoading(false));
  }, [applyUser]);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    applyUser(data.user);
    return data.user;
  }, [applyUser]);

  const register = useCallback(async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    applyUser(data.user);
    return data.user;
  }, [applyUser]);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } finally { applyUser(null); }
  }, [applyUser]);

  /** Save or un-save a college. Returns true if it is now saved. */
  const toggleShortlist = useCallback(async (collegeId) => {
    const { data } = await api.post(`/users/shortlist/${collegeId}`);
    setShortlistIds(data.ids.map(String));
    return data.shortlisted;
  }, []);

  const value = useMemo(
    () => ({ user, loading, shortlistIds, login, register, logout, toggleShortlist }),
    [user, loading, shortlistIds, login, register, logout, toggleShortlist]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
