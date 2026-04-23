const { ActivityLog } = require('./database-schemas');
const { sendPushNotification } = require('./push-setup');

const logActivity = async (io, userId, userName, userEmail, action, details = '') => {
    try {
        const log = await ActivityLog.create({ userId, userName, userEmail, action, details });

        if (io) {
            io.to('admins').emit('new-activity', log);
        }
        
        const pushTitle = `Alert: ${log.action}`;
        const pushBody = `${log.userName}${log.details ? ' - ' + log.details : ''}`;
        sendPushNotification(pushTitle, pushBody).catch(() => {});

        return log;
    } catch (err) {
        console.error('Logging error:', err);
    }
};

module.exports = { logActivity };
