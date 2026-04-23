import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, Clock } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const ActivityLogs = () => {
    const [activityLogs, setActivityLogs] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchActivityLogs();
    }, []);

    const fetchActivityLogs = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/activity-logs`);
            setActivityLogs(res.data);
        } catch (err) {
            console.error('Error fetching activity logs:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
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

    const handleClearLogs = async () => {
        if (window.confirm('Are you sure you want to clear ALL activity logs?')) {
            try {
                await axios.delete(`${API_BASE_URL}/api/activity-logs`);
                fetchActivityLogs();
            } catch (err) {
                alert('Error clearing logs');
            }
        }
    };

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Activity Logs</h3>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button 
                        onClick={handleClearLogs} 
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
                {loading ? (
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
                                    <td style={{ fontSize: '0.875rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>{formatDate(log.createdAt)}</td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: '500' }}>{log.userName}</span>
                                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{log.userEmail}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{
                                            padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600',
                                            textTransform: 'uppercase', background: `${getActionColor(log.action)}20`, color: getActionColor(log.action)
                                        }}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td style={{ color: '#94a3b8', fontSize: '0.875rem' }}>{log.details}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </>
    );
};

export default ActivityLogs;
