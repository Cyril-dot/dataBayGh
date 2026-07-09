import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, tokenStore, setSessionExpiredHandler, apiErrorMessage } from '../api/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => tokenStore.getUser());
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const logoutLocal = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      // Only clear the local session here — do NOT navigate.
      // This handler can fire from background/guest requests too (e.g. the
      // profile-refresh-on-mount below, or a public page's own API calls
      // when a stale token happens to be sitting in localStorage). Forcibly
      // redirecting to /login from here would bounce guests off pages that
      // never required auth in the first place. Protected routes already
      // redirect on their own via their route guard once `isAuthenticated`
      // goes false, so no navigation is needed at this layer.
      logoutLocal();
    });
  }, [logoutLocal]);

  // On first load, if we have a token, refresh the profile so role / wallet
  // balance / name are accurate (not just whatever was cached at login).
  useEffect(() => {
    (async () => {
      if (tokenStore.getAccessToken()) {
        try {
          const profile = await api.auth.getProfile();
          tokenStore.updateUser(profile);
          setUser((prev) => ({ ...prev, ...profile }));
        } catch {
          // interceptor already handles clearing the session on 401;
          // nothing else to do here.
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = async (payload) => {
    const data = await api.auth.login(payload);
    tokenStore.setSession(data);
    setUser(data);
    return data;
  };

  const register = async (payload) => {
    const data = await api.auth.register(payload);
    tokenStore.setSession(data);
    setUser(data);
    return data;
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch {
      // ignore — logging out locally regardless of server response
    } finally {
      logoutLocal();
      navigate('/login');
    }
  };

  const refreshProfile = async () => {
    const profile = await api.auth.getProfile();
    tokenStore.updateUser(profile);
    setUser((prev) => ({ ...prev, ...profile }));
    return profile;
  };

  const role = (user?.role || '').toUpperCase();

  const value = {
    user,
    loading,
    isAuthenticated: !!user && !!tokenStore.getAccessToken(),
    isAdmin: role.includes('ADMIN'),
    isReseller: role.includes('RESELLER'),
    login,
    register,
    logout,
    refreshProfile,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export { apiErrorMessage };