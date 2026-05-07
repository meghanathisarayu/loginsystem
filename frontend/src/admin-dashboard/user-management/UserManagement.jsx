import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, User } from 'lucide-react';
import UserModal from './UserModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const UserManagement = ({ currentUser, refreshLogs }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'user' });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/users`);
            setUsers(res.data);
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const performedBy = { id: currentUser.id, name: currentUser.name, email: currentUser.email };
            if (editingUser) {
                await axios.put(`${API_BASE_URL}/api/users/${editingUser.id}`, { ...formData, performedBy });
            } else {
                await axios.post(`${API_BASE_URL}/api/users`, { ...formData, performedBy });
            }
            fetchUsers();
            if (refreshLogs) refreshLogs();
            setIsModalOpen(false);
        } catch (err) {
            alert('Error saving user: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleDelete = async (id) => {
        const userToDelete = users.find(u => u.id === id);
        if (userToDelete?.role === 'admin' && users.filter(u => u.role === 'admin').length <= 1) {
            alert('Cannot delete the last administrator.');
            return;
        }

        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                const performedBy = { id: currentUser.id, name: currentUser.name, email: currentUser.email };
                await axios.delete(`${API_BASE_URL}/api/users/${id}`, { data: { performedBy } });
                fetchUsers();
                if (refreshLogs) refreshLogs();
            } catch (err) {
                alert(err.response?.data?.message || 'Error deleting user');
            }
        }
    };

    return (
        <>
            <div className="section-header">
                <h3 className="section-title">User Management</h3>
                <button onClick={() => handleOpenModal()} className="btn btn-add-user">
                    <Plus size={18} /> Add New User
                </button>
            </div>

            <div className="table-container">
                {loading ? (
                    <div className="loading-container">Loading users...</div>
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
                                        <div className="action-buttons">
                                            <button onClick={() => handleOpenModal(u)} className="action-btn"><Edit2 size={16} /></button>
                                            <button onClick={() => handleDelete(u.id)} className="action-btn btn-delete"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="user-name-cell">
                                            <div className="user-avatar">
                                                <User size={16} color="#4f46e5" />
                                            </div>
                                            {u.name}
                                        </div>
                                    </td>
                                    <td>{u.email}</td>
                                    <td><span className={`role-badge ${u.role === 'admin' ? 'role-admin' : 'role-user'}`}>{u.role}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <UserModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                formData={formData} 
                setFormData={setFormData} 
                showPassword={showPassword} 
                setShowPassword={setShowPassword} 
                handleSubmit={handleSubmit} 
                editingUser={editingUser} 
            />
        </>
    );
};

export default UserManagement;
