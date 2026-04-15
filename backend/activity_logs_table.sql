-- Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
);

-- Example queries to view logs

-- View all logs (most recent first)
SELECT * FROM activity_logs ORDER BY created_at DESC;

-- View specific user's logs
SELECT * FROM activity_logs WHERE user_id = 1 ORDER BY created_at DESC;

-- View only LOGIN actions
SELECT * FROM activity_logs WHERE action = 'LOGIN' ORDER BY created_at DESC;

-- View logs from last 24 hours
SELECT * FROM activity_logs 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) 
ORDER BY created_at DESC;

-- Count actions by type
SELECT action, COUNT(*) as count 
FROM activity_logs 
GROUP BY action 
ORDER BY count DESC;
