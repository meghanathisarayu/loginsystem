import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, LogOut, Users, Edit2, Trash2, Plus, X, User, Eye, EyeOff, Activity, Clock } from 'lucide-react';
import ActivityNotification from './ActivityNotification';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'user' });
    const [showPassword, setShowPassword] = useState(false);
    const [activeTab, setActiveTab] = useState('users');
    const [activityLogs, setActivityLogs] = useState([]);
    const [logsLoading, setLogsLoading] = useState(false);

    useEffect(() => {
        fetchUsers();
        fetchActivityLogs();
    }, []);

    const fetchActivityLogs = async () => {
        setLogsLoading(true);
        try {
            const res = await axios.get('http://127.0.0.1:5000/api/activity-logs');
            setActivityLogs(res.data);
        } catch (err) {
            console.error('Error fetching activity logs:', err);
        } finally {
            setLogsLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const getActionColor = (action) => {
        switch (action) {
            case 'LOGIN': return '#10b981';
            case 'LOGOUT': return '#6b7280';
            case 'USER_CREATED': return '#3b82f6';
            case 'USER_UPDATED': return '#f59e0b';
            case 'USER_DELETED': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await axios.get('http://127.0.0.1:5000/api/users');
            setUsers(res.data);
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    const handleOpenModal = (user = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({ name: user.name, email: user.email, password: user.password, role: user.role });
            setShowPassword(true);
        } else {
            setEditingUser(null);
            setFormData({ name: '', email: '', password: '', role: 'user' });
            setShowPassword(false);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const performedBy = {
                id: currentUser.id,
                name: currentUser.name,
                email: currentUser.email
            };
            if (editingUser) {
                await axios.put(`http://127.0.0.1:5000/api/users/${editingUser.id}`, {
                    ...formData,
                    performedBy
                });
            } else {
                await axios.post('http://127.0.0.1:5000/api/users', {
                    ...formData,
                    performedBy
                });
            }
            fetchUsers();
            fetchActivityLogs();
            handleCloseModal();
        } catch (err) {
            alert('Error saving user');
        }
    };

    const handleDelete = async (id) => {
        const userToDelete = users.find(u => u.id === id);
        
        if (userToDelete && userToDelete.role === 'admin') {
            const adminCount = users.filter(u => u.role === 'admin').length;
            if (adminCount <= 1) {
                alert('Primary Admin Warning: You cannot delete the last administrator.');
                return;
            }
        }

        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                const performedBy = {
                    id: currentUser.id,
                    name: currentUser.name,
                    email: currentUser.email
                };
                await axios.delete(`http://127.0.0.1:5000/api/users/${id}`, {
                    data: { performedBy }
                });
                fetchUsers();
                fetchActivityLogs();
            } catch (err) {
                alert(err.response?.data?.message || 'Error deleting user');
            }
        }
    };

    return (
        <div className="dashboard">
            <ActivityNotification />
            <nav className="nav">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <ShieldCheck size={32} color="#818cf8" />
                    <div>
                        <h2 style={{ fontSize: '1.25rem' }}>Admin Control Center</h2>
                        <span className="role-badge role-admin">System Admin</span>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: '600' }}>{currentUser?.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{currentUser?.email}</div>
                    </div>
                    <button 
                        onClick={() => {
                            Notification.requestPermission().then(permission => {
                                if (permission === 'granted') {
                                    new Notification("Success!", { body: "Desktop notifications are now active on your PC!" });
                                } else {
                                    alert('Please allow notification permission in your browser settings.');
                                }
                            });
                        }}
                        className="btn" 
                        style={{ marginTop: 0, padding: '0.5rem 1rem', width: 'auto', background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}
                    >
                        <Activity size={18} /> Enable Alerts
                    </button>
                    <button onClick={handleLogout} className="btn" style={{ marginTop: 0, padding: '0.5rem 1rem', width: 'auto', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171' }}>
                        <LogOut size={18} />
                    </button>
                </div>
            </nav>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                <button
                    onClick={() => setActiveTab('users')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: activeTab === 'users' ? 'rgba(129, 140, 248, 0.2)' : 'transparent',
                        border: 'none',
                        borderRadius: '8px',
                        color: activeTab === 'users' ? '#818cf8' : '#94a3b8',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <Users size={18} />
                    User Management
                </button>
                <button
                    onClick={() => setActiveTab('logs')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: activeTab === 'logs' ? 'rgba(129, 140, 248, 0.2)' : 'transparent',
                        border: 'none',
                        borderRadius: '8px',
                        color: activeTab === 'logs' ? '#818cf8' : '#94a3b8',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <Activity size={18} />
                    Activity Logs
                </button>
            </div>

            {activeTab === 'users' ? (
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '600' }}>User Management</h3>
                        <button onClick={() => handleOpenModal()} className="btn" style={{ marginTop: 0, width: 'auto', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Plus size={18} /> Add New User
                        </button>
                    </div>

                    <div className="table-container">
                        {loading ? (
                            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading users...</div>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Actions</th>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u.id}>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button onClick={() => handleOpenModal(u)} className="action-btn">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(u.id)} className="action-btn btn-delete">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(129, 140, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <User size={16} color="#818cf8" />
                                                    </div>
                                                    {u.name}
                                                </div>
                                            </td>
                                            <td>{u.email}</td>
                                            <td>
                                                <span className={`role-badge ${u.role === 'admin' ? 'role-admin' : 'role-user'}`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            ) : (
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Activity Logs</h3>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button 
                                onClick={async () => {
                                    if (window.confirm('Are you sure you want to clear ALL activity logs? This cannot be undone.')) {
                                        try {
                                            await axios.delete('http://127.0.0.1:5000/api/activity-logs');
                                            fetchActivityLogs();
                                        } catch (err) {
                                            alert('Error clearing logs');
                                        }
                                    }
                                }} 
                                className="btn" 
                                style={{ marginTop: 0, width: 'auto', padding: '0.75rem 1.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <Trash2 size={18} /> Clear All
                            </button>
                            <button onClick={fetchActivityLogs} className="btn" style={{ marginTop: 0, width: 'auto', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Clock size={18} /> Refresh
                            </button>
                        </div>
                    </div>

                    <div className="table-container">
                        {logsLoading ? (
                            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading logs...</div>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Time</th>
                                        <th>User</th>
                                        <th>Action</th>
                                        <th>Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activityLogs.map(log => (
                                        <tr key={log.id}>
                                            <td style={{ fontSize: '0.875rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                                                {formatDate(log.createdAt)}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontWeight: '500' }}>{log.userName}</span>
                                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{log.userEmail}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '9999px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '600',
                                                    textTransform: 'uppercase',
                                                    background: `${getActionColor(log.action)}20`,
                                                    color: getActionColor(log.action)
                                                }}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                                                {log.details}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            )}

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3 style={{ fontSize: '1.25rem' }}>{editingUser ? 'Edit User' : 'Add New User'}</h3>
                            <button onClick={handleCloseModal} className="action-btn">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                        style={{ paddingRight: '2.5rem' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute',
                                            right: '0.75rem',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            color: '#94a3b8'
                                        }}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Role</label>
                                <select
                                    className="select-input"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <button type="submit" className="btn">
                                {editingUser ? 'Update User' : 'Create User'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
