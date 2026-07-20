import { useState, useEffect } from 'react';
import { authenticateUser, createUser, getSubscription, type User } from './db';

interface AuthState {
  user: Omit<User, 'passwordHash'> | null;
  isAuthenticated: boolean;
  isPaid: boolean;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isPaid: false,
    loading: true,
  });

  // Check sessionStorage on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedEmail = sessionStorage.getItem('masar_auth_email');
        if (storedEmail) {
          // Just fetching mock "user session" here. In real app we'd validate a token.
          // Since it's a mock, we just assume they are authenticated if email is in session.
          // To get user name without pwd, we can mock it or store name in session too.
          const name = sessionStorage.getItem('masar_auth_name') || 'User';
          
          const sub = await getSubscription(storedEmail);
          
          setState({
            user: { email: storedEmail, name, createdAt: '' }, // mock createdAt for session
            isAuthenticated: true,
            isPaid: sub?.status === 'active',
            loading: false,
          });
        } else {
          setState((s) => ({ ...s, loading: false }));
        }
      } catch (err) {
        console.error('Failed to check auth:', err);
        setState((s) => ({ ...s, loading: false }));
      }
    };
    
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const user = await authenticateUser(email, password);
      const sub = await getSubscription(user.email);
      
      sessionStorage.setItem('masar_auth_email', user.email);
      sessionStorage.setItem('masar_auth_name', user.name);
      
      setState({
        user,
        isAuthenticated: true,
        isPaid: sub?.status === 'active',
        loading: false,
      });
      return true;
    } catch (err) {
      setState((s) => ({ ...s, loading: false }));
      throw err;
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const user = await createUser({ email, password, name });
      
      sessionStorage.setItem('masar_auth_email', user.email);
      sessionStorage.setItem('masar_auth_name', user.name);

      setState({
        user,
        isAuthenticated: true,
        isPaid: false, // New users don't have subscriptions
        loading: false,
      });
      return true;
    } catch (err) {
      setState((s) => ({ ...s, loading: false }));
      throw err;
    }
  };
  
  const refreshPaymentStatus = async () => {
    if (state.user) {
      const sub = await getSubscription(state.user.email);
      setState(s => ({ ...s, isPaid: sub?.status === 'active' }));
    }
  };

  const logout = () => {
    sessionStorage.removeItem('masar_auth_email');
    sessionStorage.removeItem('masar_auth_name');
    setState({
      user: null,
      isAuthenticated: false,
      isPaid: false,
      loading: false,
    });
  };

  return {
    ...state,
    login,
    signup,
    logout,
    refreshPaymentStatus,
  };
}
