import React, { createContext, useState, useContext, useEffect } from 'react';
import { dbHelpers } from '../config/supabase';
import { useAuth } from './AuthContext';

const GroupContext = createContext();

export const useGroups = () => {
  const context = useContext(GroupContext);
  if (!context) {
    throw new Error('useGroups must be used within a GroupProvider');
  }
  return context;
};

// Alternatif isim - daha kısa
export const useGroup = () => {
  const context = useContext(GroupContext);
  if (!context) {
    throw new Error('useGroup must be used within a GroupProvider');
  }
  return context;
};

export const GroupProvider = ({ children }) => {
  const [groups, setGroups] = useState([]);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [groupTasks, setGroupTasks] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const { user, isAuthenticated } = useAuth();

  // Kullanıcının gruplarını yükle
  const loadUserGroups = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { groups: userGroups, error } = await dbHelpers.getUserGroups(user.id);
      
      if (error) {
        console.error('Load groups error:', error);
        return;
      }
      
      setGroups(userGroups || []);
      
      // Eğer mevcut grup yoksa ve gruplar varsa, ilkini seç
      if (!currentGroup && userGroups && userGroups.length > 0) {
        setCurrentGroup(userGroups[0]);
      }
    } catch (error) {
      console.error('Load groups error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Kullanıcının davetlerini yükle
  const loadUserInvitations = async () => {
    if (!user) return;
    
    try {
      const { invitations: userInvitations, error } = await dbHelpers.getUserInvitations(user.id);
      
      if (error) {
        console.error('Load invitations error:', error);
        return;
      }
      
      setInvitations(userInvitations || []);
    } catch (error) {
      console.error('Load invitations error:', error);
    }
  };

  // Grup görevlerini yükle
  const loadGroupTasks = async (groupId) => {
    if (!groupId) {
      return { success: false, error: 'Grup ID bulunamadı' };
    }
    
    try {
      const { tasks, error } = await dbHelpers.getGroupTasks(groupId);
      
      if (error) {
        console.error('Load group tasks error:', error);
        return { success: false, error: error.message || 'Görevler yüklenemedi' };
      }
      
      setGroupTasks(tasks || []);
      return { success: true, tasks: tasks || [] };
    } catch (error) {
      console.error('Load group tasks error:', error);
      return { success: false, error: error.message || 'Görevler yüklenemedi' };
    }
  };

  // Auth değiştiğinde grupları yükle
  useEffect(() => {
    if (isAuthenticated() && user) {
      loadUserGroups();
      loadUserInvitations();
    } else {
      // User çıkış yaptığında state'i temizle
      setGroups([]);
      setCurrentGroup(null);
      setGroupTasks([]);
      setInvitations([]);
    }
  }, [user, isAuthenticated]);

  // Mevcut grup değiştiğinde görevleri yükle
  useEffect(() => {
    if (currentGroup) {
      loadGroupTasks(currentGroup.group_id);
    } else {
      setGroupTasks([]);
    }
  }, [currentGroup]);

  // Grup oluştur
  const createGroup = async (groupData) => {
    if (!user) {
      return { success: false, error: 'Kullanıcı bulunamadı' };
    }
    
    try {
      setLoading(true);
      
      const { group, error } = await dbHelpers.createGroup({
        ...groupData,
        created_by: user.id,
      });
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      // Grupları yeniden yükle
      await loadUserGroups();
      
      // Yeni grubu mevcut grup olarak seç
      setCurrentGroup({
        group_id: group.id,
        group_name: group.name,
        description: group.description,
        role: 'admin',
        member_count: 1,
        pending_tasks: 0,
      });
      
      return { success: true, group };
      
    } catch (error) {
      console.error('Create group error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Kullanıcıları username ile ara
  const searchUsers = async (searchTerm) => {
    try {
      const { users, error } = await dbHelpers.searchUsersByUsername(searchTerm);
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true, users: users || [] };
      
    } catch (error) {
      console.error('Search users error:', error);
      return { success: false, error: error.message };
    }
  };

  // Grup daveti gönder
  const inviteUserToGroup = async (groupId, invitedUserId) => {
    if (!user) {
      return { success: false, error: 'Kullanıcı bulunamadı' };
    }
    
    try {
      const { invitation, error } = await dbHelpers.inviteUserToGroup(
        groupId, 
        invitedUserId, 
        user.id
      );
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true, invitation };
      
    } catch (error) {
      console.error('Invite user error:', error);
      return { success: false, error: error.message };
    }
  };

  // Daveti yanıtla
  const respondToInvitation = async (invitationId, status) => {
    try {
      const { invitation, error } = await dbHelpers.respondToInvitation(invitationId, status);
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      // Davetleri ve grupları yeniden yükle
      await loadUserInvitations();
      
      if (status === 'accepted') {
        await loadUserGroups();
      }
      
      return { success: true, invitation };
      
    } catch (error) {
      console.error('Respond to invitation error:', error);
      return { success: false, error: error.message };
    }
  };

  // Görev oluştur
  const createTask = async (taskData) => {
    if (!user || !currentGroup) {
      return { success: false, error: 'Kullanıcı veya grup bulunamadı' };
    }
    
    try {
      const { task, error } = await dbHelpers.createTask({
        ...taskData,
        group_id: currentGroup.group_id,
        created_by: user.id,
      });
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      // Grup görevlerini yeniden yükle
      await loadGroupTasks(currentGroup.group_id);
      
      return { success: true, task };
      
    } catch (error) {
      console.error('Create task error:', error);
      return { success: false, error: error.message };
    }
  };

  // Görev tamamla/geri al
  const toggleTaskCompletion = async (taskId) => {
    try {
      const { completion, error } = await dbHelpers.toggleTaskCompletion(taskId, user.id);
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true, completed: completion?.completed || false };
    } catch (error) {
      console.error('Toggle task completion error:', error);
      return { success: false, error: error.message };
    }
  };

  // Grup üyelerini getir
  const getGroupMembers = async (groupId) => {
    try {
      const { members, error } = await dbHelpers.getGroupMembers(groupId);
      
      if (error) {
        return { success: false, error: error.message, members: [] };
      }
      
      return { success: true, members };
    } catch (error) {
      console.error('Get group members error:', error);
      return { success: false, error: error.message, members: [] };
    }
  };

  // Grup üye skorlarını getir
  const getGroupMemberScores = async (groupId) => {
    try {
      const { scores, error } = await dbHelpers.getGroupMemberScores(groupId);
      
      if (error) {
        return { success: false, error: error.message, scores: [] };
      }
      
      return { success: true, scores };
    } catch (error) {
      console.error('Get group member scores error:', error);
      return { success: false, error: error.message, scores: [] };
    }
  };

  // Kullanıcı grup istatistiklerini getir
  const getUserGroupStats = async (groupId, userId) => {
    try {
      const { stats, error } = await dbHelpers.getUserGroupStats(groupId, userId);
      
      if (error) {
        return { success: false, error: error.message, stats: null };
      }
      
      return { success: true, stats };
    } catch (error) {
      console.error('Get user group stats error:', error);
      return { success: false, error: error.message, stats: null };
    }
  };

  // Günlük aktivite analizi
  const getDailyActivity = async (groupId, userId, days = 7) => {
    try {
      const { activity, error } = await dbHelpers.getDailyActivity(groupId, userId, days);
      
      if (error) {
        return { success: false, error: error.message, activity: [] };
      }
      
      return { success: true, activity };
    } catch (error) {
      console.error('Get daily activity error:', error);
      return { success: false, error: error.message, activity: [] };
    }
  };

  // Kullanıcının en iyi ve en kötü görevlerini getir
  const getUserTaskPerformance = async (groupId, userId) => {
    try {
      const { performance, error } = await dbHelpers.getUserTaskPerformance(groupId, userId);
      
      if (error) {
        return { success: false, error: error.message, performance: null };
      }
      
      return { success: true, performance };
    } catch (error) {
      console.error('Get user task performance error:', error);
      return { success: false, error: error.message, performance: null };
    }
  };

  // Görev sil
  const deleteTask = async (taskId) => {
    try {
      const { result, error } = await dbHelpers.deleteTask(taskId);
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      if (result && result.success) {
        // Grup görevlerini yeniden yükle
        if (currentGroup) {
          await loadGroupTasks(currentGroup.group_id);
        }
        return { success: true, message: result.message };
      } else {
        return { success: false, error: result?.message || 'Görev silinemedi' };
      }
    } catch (error) {
      console.error('Delete task error:', error);
      return { success: false, error: error.message };
    }
  };

  // Grup sil
  const deleteGroup = async (groupId) => {
    try {
      const { result, error } = await dbHelpers.deleteGroup(groupId);
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      if (result && result.success) {
        // Grup listesini yeniden yükle
        await loadUserGroups();
        return { success: true, message: result.message };
      } else {
        return { success: false, error: result?.message || 'Grup silinemedi' };
      }
    } catch (error) {
      console.error('Delete group error:', error);
      return { success: false, error: error.message };
    }
  };

  // Mevcut grubu değiştir
  const changeCurrentGroup = (group) => {
    setCurrentGroup(group);
  };

  // Verileri yenile
  const refreshData = async () => {
    if (user) {
      await loadUserGroups();
      await loadUserInvitations();
      if (currentGroup) {
        await loadGroupTasks(currentGroup.group_id);
      }
    }
  };

  const value = {
    // State
    groups,
    currentGroup,
    groupTasks,
    invitations,
    loading,
    
    // Actions
    createGroup,
    searchUsers,
    inviteUserToGroup,
    respondToInvitation,
    createTask,
    toggleTaskCompletion,
    deleteTask,
    changeCurrentGroup,
    refreshData,
    
    // Data loaders
    loadUserGroups,
    loadUserInvitations,
    getGroupTasks: loadGroupTasks, // Alias for external use
    getGroupMembers,
    getGroupMemberScores,
    getUserGroupStats,
    getDailyActivity,
    getUserTaskPerformance,
    deleteGroup,
  };

  return (
    <GroupContext.Provider value={value}>
      {children}
    </GroupContext.Provider>
  );
}; 