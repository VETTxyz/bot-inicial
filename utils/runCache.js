const cache = new Map();
 
function set(messageId, data) {
  cache.set(messageId, data);
}
 
function get(messageId) {
  return cache.get(messageId);
}
 
module.exports = { set, get };