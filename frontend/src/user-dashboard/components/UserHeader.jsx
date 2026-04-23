import React from 'react';
import { LayoutDashboard, LogOut } from 'lucide-react';

const UserHeader = ({ user, handleLogout }) => {
    return (
        <nav className="nav">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <LayoutDashboard size={32} color="#4ade80" />
                <div>
                    <h2 style={{ fontSize: '1.25rem' }}>User Dashboard</h2>
                    <span className="role-badge role-user">Standard User</span>
                </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '600' }}>{user?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{user?.email}</div>
                </div>
                <button onClick={handleLogout} className="btn" style={{ marginTop: 0, padding: '0.5rem 1rem', width: 'auto', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171' }}>
                    <LogOut size={18} />
                </button>
            </div>
        </nav>
    );
};

export default UserHeader;
