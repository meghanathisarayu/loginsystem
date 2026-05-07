import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Users, 
  Activity, 
  Settings, 
  LogOut, 
  Bell, 
  Search, 
  ChevronRight,
  Shield,
  Smartphone
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../styles/theme';
import { getLogs, getUsers } from '../services/api';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <View style={styles.statInfo}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
    <View style={[styles.statIconContainer, { backgroundColor: color + '15' }]}>
      <Icon size={24} color={color} />
    </View>
  </View>
);

const LogItem = ({ item }) => (
  <View style={styles.logItem}>
    <View style={[styles.logIcon, { backgroundColor: item.action === 'ERROR' ? '#fee2e2' : '#e0e7ff' }]}>
      <Activity size={18} color={item.action === 'ERROR' ? theme.colors.error : theme.colors.primary} />
    </View>
    <View style={styles.logContent}>
      <Text style={styles.logTitle}>{item.action.replace(/_/g, ' ')}</Text>
      <Text style={styles.logTime}>{item.details}</Text>
      <Text style={styles.logDate}>{new Date(item.createdAt).toLocaleString()}</Text>
    </View>
    <ChevronRight size={16} color={theme.colors.textMuted} />
  </View>
);

const AdminDashboard = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ users: 0, logs: 0, active: 0 });
  const [recentLogs, setRecentLogs] = useState([]);
  const [user, setUser] = useState(null);

  const fetchData = async () => {
    try {
      const [logsRes, usersRes, userData] = await Promise.all([
        getLogs(),
        getUsers(),
        AsyncStorage.getItem('user')
      ]);

      setRecentLogs(logsRes.data.slice(0, 10)); // Get last 10 logs
      setStats({
        users: usersRes.data.length,
        logs: logsRes.data.length,
        active: usersRes.data.filter(u => u.role === 'admin').length // Counting admins as "Privileged" or similar
      });
      setUser(JSON.parse(userData));
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.replace('Login');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name || 'Admin'}</Text>
          <Text style={styles.subGreeting}>System Overview</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={20} color={theme.colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.statsGrid}>
          <TouchableOpacity onPress={() => navigation.navigate('UserManagement')}>
            <StatCard 
              title="Total Users" 
              value={stats.users} 
              icon={Users} 
              color="#4f46e5" 
            />
          </TouchableOpacity>
          <StatCard 
            title="Active Now" 
            value={stats.active} 
            icon={Smartphone} 
            color="#10b981" 
          />
          <StatCard 
            title="System Logs" 
            value={stats.logs} 
            icon={Shield} 
            color="#f59e0b" 
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.logsContainer}>
          {recentLogs.length > 0 ? (
            recentLogs.map((log, index) => (
              <LogItem key={log._id || index} item={log} />
            ))
          ) : (
            <Text style={styles.noData}>No recent activity found</Text>
          )}
        </View>
      </ScrollView>

      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem}>
          <Activity size={24} color={theme.colors.primary} />
          <Text style={[styles.tabLabel, { color: theme.colors.primary }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('UserManagement')}>
          <Users size={24} color={theme.colors.textMuted} />
          <Text style={styles.tabLabel}>Users</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Bell size={24} color={theme.colors.textMuted} />
          <Text style={styles.tabLabel}>Alerts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Settings size={24} color={theme.colors.textMuted} />
          <Text style={styles.tabLabel}>Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textMain,
  },
  subGreeting: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  logoutBtn: {
    padding: theme.spacing.sm,
    backgroundColor: '#fef2f2',
    borderRadius: theme.borderRadius.sm,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: 100,
  },
  statsGrid: {
    flexDirection: 'column',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.white,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  statInfo: {
    flex: 1,
  },
  statTitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textMain,
  },
  statIconContainer: {
    padding: 10,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textMain,
  },
  viewAll: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  logsContainer: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  logIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  logContent: {
    flex: 1,
  },
  logTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.textMain,
  },
  logTime: {
    fontSize: 13,
    color: theme.colors.textMain,
    marginTop: 2,
  },
  logDate: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  noData: {
    padding: theme.spacing.xl,
    textAlign: 'center',
    color: theme.colors.textMuted,
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: theme.colors.white,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingBottom: 10,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 4,
    color: theme.colors.textMuted,
  }
});

export default AdminDashboard;
