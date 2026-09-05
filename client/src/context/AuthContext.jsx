import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import client, { onSessionExpired } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Set when a background request 401s outside of login/register/me — lets
  // AdminLogin explain *why* the person landed back here instead of just
  // silently dropping them at a blank login form.
  const [sessionExpired, setSessionExpired] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const { data } = await client.get('/auth/me');
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => onSessionExpired(() => {
    setUser(null);
    setSessionExpired(true);
  }), []);

  const login = async (email, password) => {
    const { data } = await client.post('/auth/login', { email, password });
    setUser(data.user);
    setSessionExpired(false);
    return data.user;
  };

  // No session is issued here anymore — Supabase won't hand one out for
  // an unconfirmed account, and this returns { verificationRequired: true }
  // instead of a user. The caller (Register.jsx) shows a "check your
  // email" state rather than navigating in as logged-in.
  const register = async (payload) => {
    const { data } = await client.post('/auth/register', payload);
    return data;
  };

  // Called by /auth/callback once it has the access_token/refresh_token
  // Supabase appended to the confirmation-link redirect.
  const verifyEmail = async (accessToken, refreshToken) => {
    const { data } = await client.post('/auth/verify', {
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    setUser(data.user);
    setSessionExpired(false);
    return data.user;
  };

  const resendVerification = async (email) => {
    const { data } = await client.post('/auth/resend-verification', { email });
    return data;
  };

  const sendMagicLink = async (email) => {
    const { data } = await client.post('/auth/magic-link', { email });
    return data;
  };

  const forgotPassword = async (email) => {
    const { data } = await client.post('/auth/forgot-password', { email });
    return data;
  };

  const resetPassword = async ({ accessToken, refreshToken, password }) => {
    const { data } = await client.post('/auth/reset-password', {
      access_token: accessToken,
      refresh_token: refreshToken,
      password,
    });
    if (data.user) {
      setUser(data.user);
      setSessionExpired(false);
    }
    return data;
  };

  const logout = async () => {
    await client.post('/auth/logout');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        sendMagicLink,
        forgotPassword,
        resetPassword,
        logout,
        verifyEmail,
        resendVerification,
        sessionExpired,
        clearSessionExpired: () => setSessionExpired(false),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

