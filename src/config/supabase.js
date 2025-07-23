import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase URL ve Anon Key - Bu değerleri Supabase dashboard'unuzdan alın
// Production için environment variables kullanın (.env dosyası)
const supabaseUrl = process.env.SUPABASE_URL || 'https://tuivwlhwwrtboaprxtit.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1aXZ3bGh3d3J0Ym9hcHJ4dGl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMzg5NTgsImV4cCI6MjA2MjYxNDk1OH0.BMI9h1Wubzsl_LP1sZ4AwWHez-uK5rhVWt6KwRfcBUI';

// Supabase client oluştur
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Auth ayarları
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // AsyncStorage ile session persistence
    storage: AsyncStorage,
    // Session storage key
    storageKey: 'supabase.auth.token',
    // Flow type için ek yapılandırma
    flowType: 'pkce',
  },
});

// Auth helper fonksiyonları
export const authHelpers = {
  // Kullanıcı kayıt
  signUp: async (email, password, userData = {}) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData, // username, display_name gibi ek veriler
          // Email confirmation'ı bypass et (geliştirme için)
          emailRedirectTo: undefined,
        },
      });
      
      if (error) throw error;
      
      return { user: data.user, session: data.session, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { user: null, session: null, error };
    }
  },

  // Kullanıcı giriş
  signIn: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      return { user: data.user, session: data.session, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { user: null, session: null, error };
    }
  },

  // Kullanıcı çıkış
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    }
  },

  // Mevcut kullanıcıyı al
  getCurrentUser: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return { user, error: null };
    } catch (error) {
      console.error('Get current user error:', error);
      return { user: null, error };
    }
  },

  // Şifre sıfırlama
  resetPassword: async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Reset password error:', error);
      return { error };
    }
  },
};

// Database helper fonksiyonları
export const dbHelpers = {
  // Kullanıcı profili al
  getUserProfile: async (userId) => {
    try {
      const { data, error } = await supabase
        .rpc('get_user_profile', { p_user_id: userId });
      
      if (error) throw error;
      const profile = data && data.length > 0 ? data[0] : null;
      return { profile, error: null };
    } catch (error) {
      console.error('Get user profile error:', error);
      return { profile: null, error };
    }
  },

  // Kullanıcı profili güncelle
  updateUserProfile: async (userId, updates) => {
    try {
      // Direct update to cus schema with proper permissions
      const { data, error } = await supabase
        .rpc('update_user_profile', { 
          p_user_id: userId, 
          p_profile_updates: updates 
        });
      
      if (error) throw error;
      // RPC returns an array, get the first element
      const profile = data && data.length > 0 ? data[0] : null;
      return { profile, error: null };
    } catch (error) {
      console.error('Update user profile error:', error);
      return { profile: null, error };
    }
  },

  // Username ile kullanıcı ara
  searchUsersByUsername: async (searchTerm) => {
    try {
      const { data, error } = await supabase
        .rpc('search_users_by_username', { search_term: searchTerm });
      
      if (error) throw error;
      return { users: data || [], error: null };
    } catch (error) {
      console.error('Search users error:', error);
      return { users: [], error };
    }
  },

  // Kullanıcının gruplarını al
  getUserGroups: async (userId) => {
    try {
      const { data, error } = await supabase
        .rpc('get_user_groups', { user_uuid: userId });
      
      if (error) throw error;
      return { groups: data || [], error: null };
    } catch (error) {
      console.error('Get user groups error:', error);
      return { groups: [], error };
    }
  },

  // Grup oluştur
  createGroup: async (groupData) => {
    try {
      const { data, error } = await supabase
        .rpc('create_group', {
          p_group_name: groupData.name,
          p_group_description: groupData.description || null,
        });
      
      if (error) throw error;
      // RPC returns an array, get the first element
      const group = data && data.length > 0 ? data[0] : null;
      return { group, error: null };
    } catch (error) {
      console.error('Create group error:', error);
      return { group: null, error };
    }
  },

  // Grup daveti gönder
  inviteUserToGroup: async (groupId, invitedUserId, invitedBy) => {
    try {
      const { data, error } = await supabase
        .rpc('invite_user_to_group', {
          p_group_id: groupId,
          p_invited_user_id: invitedUserId,
        });
      
      if (error) throw error;
      // RPC returns an array, get the first element
      const invitation = data && data.length > 0 ? data[0] : null;
      return { invitation, error: null };
    } catch (error) {
      console.error('Invite user error:', error);
      return { invitation: null, error };
    }
  },

  // Kullanıcının davetlerini al
  getUserInvitations: async (userId) => {
    try {
      const { data, error } = await supabase
        .rpc('get_user_invitations', { p_user_id: userId });
      
      if (error) throw error;
      return { invitations: data || [], error: null };
    } catch (error) {
      console.error('Get user invitations error:', error);
      return { invitations: [], error };
    }
  },

  // Daveti yanıtla
  respondToInvitation: async (invitationId, status) => {
    try {
      const { data, error } = await supabase
        .rpc('respond_to_invitation', {
          p_invitation_id: invitationId,
          p_status: status,
        });
      
      if (error) throw error;
      const invitation = data && data.length > 0 ? data[0] : null;
      return { invitation, error: null };
    } catch (error) {
      console.error('Respond to invitation error:', error);
      return { invitation: null, error };
    }
  },

  // Grup görevlerini al
  getGroupTasks: async (groupId) => {
    try {
      const { data, error } = await supabase
        .rpc('get_group_tasks', { p_group_id: groupId });
      
      if (error) throw error;
      return { tasks: data || [], error: null };
    } catch (error) {
      console.error('Get group tasks error:', error);
      return { tasks: [], error };
    }
  },

  // Görev oluştur
  createTask: async (taskData) => {
    try {
      const { data, error } = await supabase
        .rpc('create_task', {
          p_group_id: taskData.group_id,
          p_task_title: taskData.title,
          p_task_description: taskData.description || null,
          p_task_category: taskData.category || 'Genel',
          p_task_frequency: taskData.frequency || 'Günlük',
        });
      
      if (error) throw error;
      // RPC returns an array, get the first element
      const task = data && data.length > 0 ? data[0] : null;
      return { task, error: null };
    } catch (error) {
      console.error('Create task error:', error);
      return { task: null, error };
    }
  },

  // Görev durumunu değiştir
  toggleTaskCompletion: async (taskId, userId) => {
    try {
      const { data, error } = await supabase
        .rpc('toggle_task_completion', {
          p_task_id: taskId,
          p_user_id: userId,
        });
      
      if (error) throw error;
      const completion = data && data.length > 0 ? data[0] : null;
      return { completion, error: null };
    } catch (error) {
      console.error('Toggle task completion error:', error);
      return { completion: null, error };
    }
  },

  // Grup üyelerini getir
  getGroupMembers: async (groupId) => {
    try {
      const { data, error } = await supabase
        .rpc('get_group_members', {
          p_group_id: groupId,
        });
      
      if (error) throw error;
      return { members: data || [], error: null };
    } catch (error) {
      console.error('Get group members error:', error);
      return { members: [], error };
    }
  },

  // Grup üye skorlarını getir
  getGroupMemberScores: async (groupId) => {
    try {
      const { data, error } = await supabase
        .rpc('get_group_member_scores', {
          p_group_id: groupId,
        });
      
      if (error) throw error;
      return { scores: data || [], error: null };
    } catch (error) {
      console.error('Get group member scores error:', error);
      return { scores: [], error };
    }
  },

  // Kullanıcı grup istatistiklerini getir
  getUserGroupStats: async (groupId, userId) => {
    try {
      const { data, error } = await supabase
        .rpc('get_user_group_stats', {
          p_group_id: groupId,
          p_user_id: userId,
        });
      
      if (error) throw error;
      const stats = data && data.length > 0 ? data[0] : null;
      return { stats, error: null };
    } catch (error) {
      console.error('Get user group stats error:', error);
      return { stats: null, error };
    }
  },

  // Günlük aktivite analizi
  getDailyActivity: async (groupId, userId, days = 7) => {
    try {
      const { data, error } = await supabase
        .rpc('get_daily_activity', {
          p_group_id: groupId,
          p_user_id: userId,
          p_days: days,
        });
      
      if (error) throw error;
      return { activity: data || [], error: null };
    } catch (error) {
      console.error('Get daily activity error:', error);
      return { activity: [], error };
    }
  },

  // Kullanıcının en iyi ve en kötü görevlerini getir
  getUserTaskPerformance: async (groupId, userId) => {
    try {
      const { data, error } = await supabase
        .rpc('get_user_task_performance', {
          p_group_id: groupId,
          p_user_id: userId,
        });
      
      if (error) throw error;
      const performance = data && data.length > 0 ? data[0] : null;
      return { performance, error: null };
    } catch (error) {
      console.error('Get user task performance error:', error);
      return { performance: null, error };
    }
  },

  // Görev sil
  deleteTask: async (taskId) => {
    try {
      const { data, error } = await supabase
        .rpc('delete_task', {
          p_task_id: taskId,
        });
      
      if (error) throw error;
      const result = data && data.length > 0 ? data[0] : null;
      return { result, error: null };
    } catch (error) {
      console.error('Delete task error:', error);
      return { result: null, error };
    }
  },

  // Grup sil
  deleteGroup: async (groupId) => {
    try {
      const { data, error } = await supabase
        .rpc('delete_group', {
          p_group_id: groupId,
        });
      
      if (error) throw error;
      const result = data && data.length > 0 ? data[0] : null;
      return { result, error: null };
    } catch (error) {
      console.error('Delete group error:', error);
      return { result: null, error };
    }
  },
};

export default supabase; 