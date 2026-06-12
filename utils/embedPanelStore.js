const activeSessions = new Map();
const SESSION_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutos

function refreshSession(panelId) {
  const session = activeSessions.get(panelId);
  if (!session) return;

  if (session.timeoutId) {
    clearTimeout(session.timeoutId);
  }

  session.timeoutId = setTimeout(() => {
    activeSessions.delete(panelId);
  }, SESSION_TIMEOUT_MS);
}

function createSession(panelId, userId, channelId, messageId, options) {
  const session = {
    panelId,
    userId,
    channelId,
    messageId,
    options,
    timeoutId: null,
  };

  activeSessions.set(panelId, session);
  refreshSession(panelId);
  return session;
}

function getSession(panelId) {
  const session = activeSessions.get(panelId);
  if (!session) return null;
  refreshSession(panelId);
  return session;
}

function updateSession(panelId, updates) {
  const session = activeSessions.get(panelId);
  if (!session) return null;
  Object.assign(session, updates);
  refreshSession(panelId);
  return session;
}

function deleteSession(panelId) {
  const session = activeSessions.get(panelId);
  if (session && session.timeoutId) {
    clearTimeout(session.timeoutId);
  }
  activeSessions.delete(panelId);
}

module.exports = {
  createSession,
  getSession,
  updateSession,
  deleteSession,
};
