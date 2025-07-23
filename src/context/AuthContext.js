import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase, authHelpers, dbHelpers } from '../config/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  // Auth state değişikliklerini dinle
  useEffect(() => {
    let isMounted = true;
    
    // Mevcut session'ı al - Daha güçlü session recovery
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        
        // Önce session'ı kontrol et
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Get session error:', error);
          // Session hatası varsa temizle
          setSession(null);
          setUser(null);
          setUserProfile(null);
        } else if (session) {
          console.log('Existing session found:', session.user?.email);
          
          // Session varsa kullanıcıyı ayarla
          if (isMounted) {
            setSession(session);
            setUser(session.user);
            
            // Profili yükle
            try {
              await fetchUserProfile(session.user.id);
              console.log('Session restored successfully');
            } catch (profileError) {
              console.error('Profile fetch error during init:', profileError);
            }
          }
        } else {
          console.log('No existing session found');
          // Session yoksa state'i temizle
          if (isMounted) {
            setSession(null);
            setUser(null);
            setUserProfile(null);
          }
        }
      } catch (error) {
        console.error('Session initialization error:', error);
        // Hata durumunda state'i temizle
        if (isMounted) {
          setSession(null);
          setUser(null);
          setUserProfile(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setInitializing(false);
        }
      }
    };

    // Initialize auth
    initializeAuth();

    // Auth state değişikliklerini dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email || 'no user');
        
        if (!isMounted) return;
        
        // State güncellemeleri
        setSession(session);
        setUser(session?.user || null);
        
        if (session?.user) {
          // Kullanıcı giriş yaptı, profilini al
          try {
            await fetchUserProfile(session.user.id);
            console.log('Profile loaded after auth state change');
          } catch (error) {
            console.error('Profile fetch error:', error);
          }
        } else {
          // Kullanıcı çıkış yaptı
          setUserProfile(null);
          console.log('User logged out - profile cleared');
        }
        
        setLoading(false);
        setInitializing(false);
      }
    );

    // Cleanup function
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Kullanıcı profilini getir
  const fetchUserProfile = async (userId) => {
    try {
      const { profile, error } = await dbHelpers.getUserProfile(userId);
      
      if (error) {
        console.error('Fetch user profile error:', error);
        return;
      }
      
      setUserProfile(profile);
    } catch (error) {
      console.error('Fetch user profile error:', error);
    }
  };

  // Kayıt ol
  const signUp = async (email, password, username, displayName) => {
    try {
      setLoading(true);
      
      const { user, session, error } = await authHelpers.signUp(
        email, 
        password, 
        { 
          username,
          display_name: displayName || username,
        }
      );
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      // Supabase auth başarılı, profil trigger tarafından oluşturulacak
      return { 
        success: true, 
        user,
        message: 'Kayıt başarılı! Lütfen e-postanızı kontrol edin.' 
      };
      
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Giriş yap
  const signIn = async (email, password) => {
    try {
      setLoading(true);
      
      const { user, session, error } = await authHelpers.signIn(email, password);
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true, user, session };
      
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Çıkış yap
  const signOut = async () => {
    try {
      setLoading(true);
      console.log('Signing out...');
      
      // Supabase auth'dan çıkış yap
      const { error } = await authHelpers.signOut();
      
      if (error) {
        console.error('Supabase signOut error:', error);
        return { success: false, error: error.message };
      }
      
      // Local state'i hemen temizle
      setSession(null);
      setUser(null);
      setUserProfile(null);
      
      // AsyncStorage'dan session'ı elle temizle (güvenlik için)
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.removeItem('supabase.auth.token');
        await AsyncStorage.removeItem('sb-tuivwlhwwrtboaprxtit-auth-token');
        console.log('Local storage cleared');
      } catch (storageError) {
        console.warn('Storage clear error:', storageError);
      }
      
      console.log('Sign out successful');
      return { success: true };
      
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Şifre sıfırlama
  const resetPassword = async (email) => {
    try {
      const { error } = await authHelpers.resetPassword(email);
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { 
        success: true, 
        message: 'Şifre sıfırlama bağlantısı e-postanıza gönderildi.' 
      };
      
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, error: error.message };
    }
  };

  // Profil güncelle
  const updateProfile = async (updates) => {
    try {
      if (!user) {
        return { success: false, error: 'Kullanıcı bulunamadı' };
      }
      
      setLoading(true);
      
      const { profile, error } = await dbHelpers.updateUserProfile(user.id, updates);
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      setUserProfile(profile);
      return { success: true, profile };
      
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Username kontrolü
  const checkUsernameAvailability = async (username) => {
    try {
      const { users, error } = await dbHelpers.searchUsersByUsername(username);
      
      if (error) {
        return { available: false, error: error.message };
      }
      
      const exactMatch = users.find(u => u.username.toLowerCase() === username.toLowerCase());
      
      return { 
        available: !exactMatch,
        error: null 
      };
      
    } catch (error) {
      console.error('Check username error:', error);
      return { available: false, error: error.message };
    }
  };

  // Auth durumu kontrol et
  const isAuthenticated = () => {
    return !!(user && session);
  };

  // Profil tamamlığını kontrol et
  const isProfileComplete = () => {
    return !!(userProfile && userProfile.username && userProfile.display_name);
  };

  const value = {
    // State
    user,
    userProfile,
    session,
    loading,
    initializing,
    
    // Auth methods
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    
    // Helper methods
    checkUsernameAvailability,
    isAuthenticated,
    isProfileComplete,
    fetchUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 