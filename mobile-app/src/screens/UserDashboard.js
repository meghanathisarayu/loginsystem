import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  User, 
  Mail, 
  Shield, 
  LogOut, 
  ChevronRight, 
  Bell, 
  Lock, 
  Info,
  Calendar,
  Smartphone
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../styles/theme';

const SettingItem = ({ icon: Icon, title, value, onPress, type = 'link' }) => (
  <TouchableOpacity style={styles.settingItem} onPress={onPress} disabled={type === 'toggle'}>
    <View style={styles.settingLeft}>
      <View style={styles.settingIcon}>
        <Icon size={20} color={theme.colors.primary} />
      </View>
      <Text style={styles.settingTitle}>{title}</Text>
    </View>
    <View style={styles.settingRight}>
      {type === 'link' && (
        <>
          {value && <Text style={styles.settingValue}>{value}</Text>}
          <ChevronRight size={18} color={theme.colors.textMuted} />
        </>
      )}
      {type === 'toggle' && (
        <Switch 
          value={value} 
          onValueChange={onPress}
          trackColor={{ false: '#e2e8f0', true: theme.colors.primary + '80' }}
          thumbColor={value ? theme.colors.primary : '#fff'}
        />
      )}
    </View>
  </TouchableOpacity>
);

const UserDashboard = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          setUser(JSON.parse(userData));
        }
      } catch (err) {
        console.error('Error loading user:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            navigation.replace('Login');
          }
        }
      ]
    );
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.profileInfo}>
            <View style={styles.avatarLarge}>
              <User size={40} color={theme.colors.white} />
            </View>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'email@example.com'}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{user?.role?.toUpperCase() || 'USER'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Mail size={18} color={theme.colors.textMuted} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email Address</Text>
                <Text style={styles.infoValue}>{user?.email}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Shield size={18} color={theme.colors.textMuted} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Role</Text>
                <Text style={styles.infoValue}>{user?.role === 'admin' ? 'Administrator' : 'Standard User'}</Text>
              </View>
            </View>
            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <Calendar size={18} color={theme.colors.textMuted} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Member Since</Text>
                <Text style={styles.infoValue}>May 2026</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.card}>
            <SettingItem 
              icon={Bell} 
              title="Push Notifications" 
              type="toggle"
              value={notificationsEnabled}
              onPress={() => setNotificationsEnabled(!notificationsEnabled)}
            />
            <SettingItem 
              icon={Lock} 
              title="Change Password" 
              onPress={() => Alert.alert('Notice', 'Password change feature coming soon')}
            />
            <SettingItem 
              icon={Smartphone} 
              title="Devices" 
              value="1 Active"
              onPress={() => {}}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Info</Text>
          <View style={styles.card}>
            <SettingItem 
              icon={Info} 
              title="Version" 
              value="1.0.0 (Build 55)"
              onPress={() => {}}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={20} color={theme.colors.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
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
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: theme.colors.primary,
    paddingTop: 40,
    paddingBottom: 60,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
  },
  profileInfo: {
    alignItems: 'center',
  },
  avatarLarge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.white,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 12,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    color: theme.colors.white,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginTop: -30,
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textMuted,
    marginBottom: 12,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoContent: {
    marginLeft: 16,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: theme.colors.textMain,
    fontWeight: '500',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 15,
    color: theme.colors.textMain,
    fontWeight: '500',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginRight: 8,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: theme.spacing.lg,
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.error,
  }
});

export default UserDashboard;
