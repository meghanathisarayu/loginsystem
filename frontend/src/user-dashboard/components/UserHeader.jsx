import React from 'react';
import { LayoutDashboard, LogOut } from 'lucide-react';

const UserHeader = ({ user, handleLogout }) => {
    return (
        <nav className="nav">
            <div className="header-title-container">
                <LayoutDashboard size={32} color="#4f46e5" />
                <div>
                    <h2 className="header-title">User Dashboard</h2>
                    <span className="role-badge role-user">Standard User</span>
                </div>
            </div>
            <div className="header-actions">
                <div className="user-info">
                    <div className="user-name">{user?.name}</div>
                    <div className="user-email">{user?.email}</div>
                </div>
                <button onClick={handleLogout} className="btn btn-header btn-danger">
                    <LogOut size={18} />
                </button>
            </div>
        </nav>
    );
};

export default UserHeader;
