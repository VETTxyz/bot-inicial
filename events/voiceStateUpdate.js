const { QuickDB } = require('quick.db');
const db = new QuickDB();


function scheduleNicknameUpdate(guild, delay = 1000) {
  if (nicknameUpdateTimer || pendingNicknameUpdate) return;

  nicknameUpdateTimer = setTimeout(async () => {
    nicknameUpdateTimer = null;
    pendingNicknameUpdate = true;
    await updateBotNickname(guild);
  }, delay);
}

module.exports = {
  name: 'voiceStateUpdate',
  
  async execute(oldState, newState) {
    // Ignora bots
    if (newState.member.user.bot) return;

    const guildId = newState.guild.id;
    const userId = newState.member.id;
    const trackingKey = `voiceTime_${guildId}_${userId}_sessions`;
    const userStatusKey = `voiceTime_${guildId}_${userId}_lastStatus`;

    // Usuário entrou em um canal de voz
    if (!oldState.channelId && newState.channelId) {
      const joinTime = Date.now();
      await db.set(userStatusKey, { joinedAt: joinTime, channelId: newState.channelId });
      console.log(`🎤 ${newState.member.user.tag} entrou em um canal de voz.`);
      
      // Atualizar nickname do bot
      scheduleNicknameUpdate(newState.guild);
    }
    
    // Usuário saiu de um canal de voz
    else if (oldState.channelId && !newState.channelId) {
      const userStatus = await db.get(userStatusKey);
      
      if (userStatus && userStatus.joinedAt) {
        const timeInCall = Math.floor((Date.now() - userStatus.joinedAt) / 1000); // em segundos
        
        if (timeInCall > 5) { // Apenas registra se ficou mais de 5 segundos
          const sessions = (await db.get(trackingKey)) || [];
          sessions.push({
            channelId: oldState.channelId,
            duration: timeInCall,
            timestamp: Date.now(),
          });
          
          // Manter apenas as últimas 100 sessões
          const recentSessions = sessions.slice(-100);
          await db.set(trackingKey, recentSessions);
          
          // Atualizar total de horas
          const totalSecondsKey = `voiceTime_${guildId}_${userId}_total`;
          const currentTotal = (await db.get(totalSecondsKey)) || 0;
          await db.set(totalSecondsKey, currentTotal + timeInCall);
        }
      }
      
      // Limpar status quando sai
      await db.delete(userStatusKey);
      console.log(`📵 ${newState.member.user.tag} saiu de um canal de voz.`);
      
      // Atualizar nickname do bot
      scheduleNicknameUpdate(newState.guild);
    }
    
    // Mudou de canal (sem entrar ou sair)
    else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
      const userStatus = await db.get(userStatusKey);
      
      if (userStatus && userStatus.joinedAt) {
        const timeInCall = Math.floor((Date.now() - userStatus.joinedAt) / 1000);
        
        if (timeInCall > 5) {
          const sessions = (await db.get(trackingKey)) || [];
          sessions.push({
            channelId: oldState.channelId,
            duration: timeInCall,
            timestamp: Date.now(),
          });
          
          const recentSessions = sessions.slice(-100);
          await db.set(trackingKey, recentSessions);
          
          const totalSecondsKey = `voiceTime_${guildId}_${userId}_total`;
          const currentTotal = (await db.get(totalSecondsKey)) || 0;
          await db.set(totalSecondsKey, currentTotal + timeInCall);
        }
      }
      
      // Resetar o tempo para o novo canal
      await db.set(userStatusKey, { joinedAt: Date.now(), channelId: newState.channelId });
      console.log(`🔄 ${newState.member.user.tag} mudou de canal de voz.`);
    }
  }
};
