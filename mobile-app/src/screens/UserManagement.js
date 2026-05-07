import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Users, 
  Search, 
  UserPlus, 
  Edit2, 
  Trash2, 
  X, 
  Shield, 
  User as UserIcon,
  Eye,
  EyeOff,
  ChevronLeft
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../styles/theme';
import { getUsers, createUser, updateUser, deleteUser } from '../services/api';
import CustomAlert from '../components/CustomAlert';

const UserManagement = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [adminUser, setAdminUser] = useState(null);

  // Custom Alert State
  const [alert, setAlert] = useState({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: null,
    showCancel: false
  });

  const showAlert = (title, message, type = 'info', onConfirm = null, showCancel = false) => {
    setAlert({ visible: true, title, message, type, onConfirm, showCancel });
  };

  const hideAlert = () => setAlert({ ...alert, visible: false });

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user'
  });

  const fetchData = async () => {
    try {
      const [usersRes, userData] = await Promise.all([
        getUsers(),
        AsyncStorage.getItem('user')
      ]);
      setUsers(usersRes.data);
      setFilteredUsers(usersRes.data);
      setAdminUser(JSON.parse(userData));
    } catch (err) {
      console.error('Error fetching users:', err);
      showAlert('Error', 'Failed to load users', 'error');
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

  const handleSearch = (text) => {
    setSearchQuery(text);
    const filtered = users.filter(user => 
      user.name.toLowerCase().includes(text.toLowerCase()) || 
      user.email.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', role: 'user' });
    setShowPassword(false);
    setModalVisible(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({ 
      name: user.name, 
      email: user.email, 
      password: '', 
      role: user.role 
    });
    setShowPassword(false);
    setModalVisible(true);
  };

  const handleSaveUser = async () => {
    if (!formData.name || !formData.email || (!editingUser && !formData.password)) {
      showAlert('Required', 'Please fill in all fields', 'warning');
      return;
    }

    setFormLoading(true);
    try {
      const payload = { 
        ...formData, 
        performedBy: { id: adminUser.id, name: adminUser.name, email: adminUser.email } 
      };

      if (editingUser) {
        await updateUser(editingUser.id, payload);
      } else {
        await createUser(payload);
      }
      
      setModalVisible(false);
      fetchData();
      showAlert('Success', `User ${editingUser ? 'updated' : 'created'} successfully`, 'success');
    } catch (err) {
      showAlert('Error', err.response?.data?.error || 'Operation failed', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = (user) => {
    if (user.id === adminUser.id) {
      showAlert('Action Denied', 'You cannot delete your own account', 'error');
      return;
    }

    showAlert(
      'Confirm Delete',
      `Are you sure you want to remove ${user.name}? This action cannot be undone.`,
      'warning',
      async () => {
        hideAlert();
        try {
          const performedBy = { id: adminUser.id, name: adminUser.name, email: adminUser.email };
          await deleteUser(user.id, performedBy);
          fetchData();
          showAlert('Deleted', 'User removed successfully', 'success');
        } catch (err) {
          showAlert('Error', err.response?.data?.message || 'Delete failed', 'error');
        }
      },
      true
    );
  };

  const renderUserItem = ({ item }) => (
    <View style={styles.userCard}>
      <View style={[styles.avatar, { backgroundColor: item.role === 'admin' ? '#e0e7ff' : '#f1f5f9' }]}>
        {item.role === 'admin' ? (
          <Shield size={20} color={theme.colors.primary} />
        ) : (
          <UserIcon size={20} color={theme.colors.textMuted} />
        )}
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <View style={[styles.roleBadge, { backgroundColor: item.role === 'admin' ? '#4f46e5' : '#64748b' }]}>
          <Text style={styles.roleText}>{item.role.toUpperCase()}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => openEditModal(item)}>
          <Edit2 size={18} color={theme.colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDeleteUser(item)}>
          <Trash2 size={18} color={theme.colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color={theme.colors.textMain} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Management</Text>
        <TouchableOpacity onPress={openAddModal} style={styles.addBtn}>
          <UserPlus size={20} color={theme.colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Search size={20} color={theme.colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or email..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Users size={64} color={theme.colors.border} />
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          }
        />
      )}

      {/* Add/Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingUser ? 'Edit User' : 'Add New User'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  value={formData.name}
                  onChangeText={(val) => setFormData({...formData, name: val})}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="john@example.com"
                  value={formData.email}
                  onChangeText={(val) => setFormData({...formData, email: val})}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Password {editingUser && '(Leave blank to keep current)'}</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Min 6 characters"
                    value={formData.password}
                    onChangeText={(val) => setFormData({...formData, password: val})}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={20} color={theme.colors.textMuted} /> : <Eye size={20} color={theme.colors.textMuted} />}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>User Role</Text>
                <View style={styles.rolePicker}>
                  <TouchableOpacity 
                    style={[styles.roleOption, formData.role === 'user' && styles.roleOptionSelected]}
                    onPress={() => setFormData({...formData, role: 'user'})}
                  >
                    <Text style={[styles.roleOptionText, formData.role === 'user' && styles.roleOptionTextSelected]}>User</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.roleOption, formData.role === 'admin' && styles.roleOptionSelected]}
                    onPress={() => setFormData({...formData, role: 'admin'})}
                  >
                    <Text style={[styles.roleOptionText, formData.role === 'admin' && styles.roleOptionTextSelected]}>Admin</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.saveBtn, formLoading && styles.saveBtnDisabled]} 
                onPress={handleSaveUser}
                disabled={formLoading}
              >
                {formLoading ? (
                  <ActivityIndicator color={theme.colors.white} />
                ) : (
                  <Text style={styles.saveBtnText}>{editingUser ? 'Update User' : 'Create User'}</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <CustomAlert 
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={hideAlert}
        onConfirm={alert.onConfirm}
        showCancel={alert.showCancel}
        confirmText={alert.showCancel ? 'Yes, Delete' : 'Great!'}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
  backBtn: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textMain,
  },
  addBtn: {
    backgroundColor: theme.colors.primary,
    padding: 10,
    borderRadius: 10,
  },
  searchContainer: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.white,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    height: 48,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textMain,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: theme.spacing.lg,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textMain,
  },
  userEmail: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.white,
  },
  actions: {
    flexDirection: 'row',
  },
  actionBtn: {
    padding: 8,
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: '80%',
    padding: theme.spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textMain,
  },
  modalForm: {
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.inputBg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    height: 50,
    paddingHorizontal: theme.spacing.md,
    fontSize: 15,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.inputBg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    height: 50,
    paddingHorizontal: theme.spacing.md,
  },
  passwordInput: {
    flex: 1,
    fontSize: 15,
  },
  rolePicker: {
    flexDirection: 'row',
    gap: 12,
  },
  roleOption: {
    flex: 1,
    height: 45,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.inputBg,
  },
  roleOptionSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  roleOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textMuted,
  },
  roleOptionTextSelected: {
    color: theme.colors.white,
  },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    height: 56,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    marginBottom: 40,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  }
});

export default UserManagement;
