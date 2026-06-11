const { Events, EmbedBuilder, ChannelType, ActivityType } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, NoSubscriberError } = require('@discordjs/voice');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

const RANK_CHANNEL_ID = '1513117502765400184';
const CALL_CHANNEL_ID = '1513507697146859521';
const RANK_INTERVAL_MS = 5 * 60 * 1000;

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

async function updateBotStatus(client) {
  try {
    let topUserByMessages = null;
    let topUserByCallHours = null;
    let maxMessages = 0;
    let maxCallSeconds = 0;

    // Procurar o usuário com mais mensagens
    const allMessages = (await db.all()).filter(entry => entry.id.startsWith('messages_'));
    for (const entry of allMessages) {
      const count = Number(entry.value) || 0;
      if (count > maxMessages) {
        maxMessages = count;
        topUserByMessages = entry.id.split('_').pop();
      }
    }

    // Procurar o usuário com mais horas em call
    const allCallHours = (await db.all()).filter(entry => entry.id.endsWith('_total') && entry.id.includes('voiceTime_'));
    for (const entry of allCallHours) {
      const seconds = Number(entry.value) || 0;
      if (seconds > maxCallSeconds) {
        maxCallSeconds = seconds;
        topUserByCallHours = entry.id.split('_')[2];
      }
    }

    const topUser = topUserByCallHours || topUserByMessages;
    
    if (topUser) {
      try {
        const user = await client.users.fetch(topUser).catch(() => null);
        if (user) {
          const displayName = user.username;
          const hours = Math.floor(maxCallSeconds / 3600);
          
          await client.user.setPresence({
            activities: [{
              name: `${displayName} com ${hours}h+ em call 🎤`,
              type: ActivityType.Streaming,
              url: 'https://www.twitch.tv/_vettxyz',
            }],
            status: 'online',
          });
        }
      } catch (fetchError) {
        console.error('❌ Erro ao buscar usuário para status:', fetchError.message);
      }
    } else {
      // Fallback quando não há dados
      await client.user.setPresence({
        activities: [{
          name: 'por -help 📚',
          type: ActivityType.Watching,
        }],
        status: 'online',
      });
    }
  } catch (error) {
    console.error('❌ Erro ao atualizar status do bot:', error.message);
  }
}

async function updateMessageRanking(client) {
  const channel = await client.channels.fetch(RANK_CHANNEL_ID).catch(() => null);
  if (!channel || !channel.isTextBased()) {
    console.warn(`⚠️ Não foi possível acessar o canal de ranking ${RANK_CHANNEL_ID}.`);
    return;
  }

  const guild = channel.guild;
  if (!guild) {
    console.warn(`⚠️ Canal de ranking ${RANK_CHANNEL_ID} não pertence a um servidor válido.`);
    return;
  }

  // ===== LIMPAR MENSAGEM ANTIGA (SE EXISTIR) =====
  try {
    const oldMessageId = await db.get(`rankMessage_${guild.id}`);
    if (oldMessageId) {
      const oldMessage = await channel.messages.fetch(oldMessageId).catch(() => null);
      if (oldMessage) {
        await oldMessage.delete();
        await db.delete(`rankMessage_${guild.id}`);
        console.log('🗑️ Mensagem de ranking antiga removida.');
      }
    }
  } catch (error) {
    console.warn('⚠️ Erro ao remover mensagem antiga:', error.message);
  }

  const members = await guild.members.fetch().catch(() => guild.members.cache);
  
  // ===== RANKING DE MENSAGENS =====
  const messageEntries = (await db.all()).filter(entry => entry.id.startsWith(`messages_${guild.id}_`));

  const validMessageEntries = messageEntries
    .map(entry => {
      const id = entry.id.split('_').pop();
      const member = members.get(id);
      if (!member || member.user.bot) return null;
      
      return {
        id,
        member,
        messages: Number(entry.value) || 0,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.messages - a.messages);

  const invalidMessageKeys = messageEntries
    .filter(entry => {
      const id = entry.id.split('_').pop();
      const member = members.get(id);
      return !member || member.user.bot;
    })
    .map(entry => entry.id);

  await Promise.all(invalidMessageKeys.map(key => db.delete(key)));

  // ===== RANKING DE HORAS EM CALL =====
  const callEntries = (await db.all()).filter(entry => entry.id.endsWith('_total') && entry.id.includes(`voiceTime_${guild.id}_`));

  const validCallEntries = callEntries
    .map(entry => {
      const id = entry.id.split('_')[2];
      const member = members.get(id);
      if (!member || member.user.bot) return null;
      
      return {
        id,
        member,
        callSeconds: Number(entry.value) || 0,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.callSeconds - a.callSeconds);

  // ===== EMBED DE MENSAGENS =====
  const topMessageEntries = validMessageEntries.slice(0, 10);
  const messageDescription = topMessageEntries.length
    ? topMessageEntries.map((entry, index) => `**${index + 1}.** ${entry.member.user.toString()} — **${entry.messages}** 📧`).join('\n')
    : 'Nenhuma mensagem registrada ainda.';

  const messageEmbed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('💬 Ranking de Mensagens')
    .setDescription(messageDescription)
    .addFields({
      name: '📊 Estatísticas',
      value: `👥 Usuários: ${validMessageEntries.length}\n💬 Total: ${validMessageEntries.reduce((sum, e) => sum + e.messages, 0)} mensagens`,
    })
    .setFooter({ text: 'Use -mensagens para mais detalhes' })
    .setThumbnail("https://cdn.discordapp.com/attachments/1513115563679940658/1513512145671946270/pngwing.com_2.png?ex=6a27ff87&is=6a26ae07&hm=704a95109b217c561cb999b51184ea449915a6558ad3b8d8849359dcd5d72a5a&")
    .setTimestamp();

  // ===== EMBED DE HORAS EM CALL =====
  const topCallEntries = validCallEntries.slice(0, 10);
  const callDescription = topCallEntries.length
    ? topCallEntries.map((entry, index) => `**${index + 1}.** ${entry.member.user.toString()} — **${formatTime(entry.callSeconds)}** 🎤`).join('\n')
    : 'Nenhuma hora em call registrada ainda.';

  const callEmbed = new EmbedBuilder()
    .setColor('#9c27b0')
    .setTitle('🎤 Ranking de Horas em Call')
    .setThumbnail("")
    .setDescription(callDescription)
    .addFields({
      name: '⏱️ Estatísticas',
      value: `👥 Usuários: ${validCallEntries.length}\n🎤 Total: ${formatTime(validCallEntries.reduce((sum, e) => sum + e.callSeconds, 0))}`,
    })
    .setFooter({ text: 'Use -call para mais detalhes' })
    .setTimestamp();

  // ===== SALVAR E ENVIAR EMBEDS =====
  const lastMessageIds = await db.get(`rankMessages_${guild.id}`) || { msg: null, call: null };
  let messageMsg = null;
  let callMsg = null;

  if (lastMessageIds.msg) {
    messageMsg = await channel.messages.fetch(lastMessageIds.msg).catch(() => null);
  }
  if (lastMessageIds.call) {
    callMsg = await channel.messages.fetch(lastMessageIds.call).catch(() => null);
  }

  try {
    // Atualizar ou enviar ranking de mensagens
    if (messageMsg) {
      await messageMsg.edit({ embeds: [messageEmbed] });
    } else {
      const sentMessage = await channel.send({ embeds: [messageEmbed] });
      lastMessageIds.msg = sentMessage.id;
    }

    // Atualizar ou enviar ranking de call
    if (callMsg) {
      await callMsg.edit({ embeds: [callEmbed] });
    } else {
      const sentMessage = await channel.send({ embeds: [callEmbed] });
      lastMessageIds.call = sentMessage.id;
    }

    await db.set(`rankMessages_${guild.id}`, lastMessageIds);
  } catch (error) {
    console.error('❌ Erro ao atualizar rankings:', error);
  }
}

async function connectBotToVoiceChannel(client) {
  try {
    const channel = await client.channels.fetch(CALL_CHANNEL_ID).catch(() => null);
    
    if (!channel) {
      console.warn(`⚠️ Canal de voz ${CALL_CHANNEL_ID} não encontrado.`);
      return;
    }

    if (channel.type !== ChannelType.GuildVoice) {
      console.warn(`⚠️ ${CALL_CHANNEL_ID} não é um canal de voz.`);
      return;
    }

    // Verificar se já está conectado
    if (channel.members.has(client.user.id)) {
      console.log(`🎤 Bot já está conectado ao canal de voz ${channel.name}`);
      return;
    }

    // Conectar usando a biblioteca @discordjs/voice
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });

    console.log(`🎤 Bot conectado ao canal de voz: ${channel.name}`);
  } catch (error) {
    console.error('❌ Erro ao conectar ao canal de voz:', error.message);
  }
}

module.exports = {
  name: Events.ClientReady,
  once: true, // Este evento ocorre apenas uma vez
  
  execute(client) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🚀 Bot online com sucesso!`);
    console.log(`👤 Conectado como: ${client.user.tag}`);
    console.log(`🆔 ID do bot: ${client.user.id}`);
    console.log(`📊 Servidores: ${client.guilds.cache.size}`);
    console.log(`👥 Usuários: ${client.users.cache.size}`);
    console.log(`${'='.repeat(50)}\n`);

    // Conectar o bot ao canal de voz
    connectBotToVoiceChannel(client);

    // Atualizar status inicial
    updateBotStatus(client);

    // Atualizar ranking inicial
    updateMessageRanking(client);

    // Configurar atualizações periódicas
    setInterval(() => updateBotStatus(client), 30 * 10000); // A cada 30 segundos
    setInterval(() => updateMessageRanking(client), RANK_INTERVAL_MS); // A cada 5 minutos
  }
};

