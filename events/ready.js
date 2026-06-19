const { Events, ChannelType, ActivityType } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');

const CALL_CHANNEL_ID = '1513507697146859521';

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

    joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });

    console.log(`🎤 Bot conectado ao canal de voz: ${channel.name}`);
  } catch (error) {
    console.error('❌ Erro ao conectar ao canal de voz:', error.message);
  }
}

async function updateBotStatus(client) {
  try {
    await client.user.setPresence({
      activities: [{
        name: 'por -help 📚',
        type: ActivityType.Watching,
      }],
      status: 'online',
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar status do bot:', error.message);
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

    // Definir status inicial
    updateBotStatus(client);
  }
};