const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');

function generateTokens(userId) {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'groupz1-secret-key-2024', { expiresIn: '1d' });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET || 'groupz1-refresh-key-2024', { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'groupz1-refresh-key-2024');
}

async function logActivity(userId, action, resource, resourceId, details, req) {
  try {
    await ActivityLog.create({
      user: userId,
      action,
      resource,
      resourceId,
      details,
      ipAddress: req?.ip,
      userAgent: req?.headers?.['user-agent']
    });
  } catch (err) {
    console.error('Activity log error:', err.message);
  }
}

async function createNotification(userId, type, title, message, link = '', relatedTo = null, onModel = null) {
  try {
    await Notification.create({ user: userId, type, title, message, link, relatedTo, onModel });
  } catch (err) {
    console.error('Notification error:', err.message);
  }
}

module.exports = { generateTokens, verifyRefreshToken, logActivity, createNotification };
