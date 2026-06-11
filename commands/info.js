const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'info',
  description: 'Mostra informações do bot e do servidor',
  aliases: ['i', 'botinfo'],
  usage: 'info',
  category: 'utility',
  cooldown: 5,

  async execute(message, args, client) {
    try {
      const guild = message.guild;
      const botInfoEmbed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('🤖 Informações do Bot')
        .setThumbnail(client.user.displayAvatarURL({ size: 512 }))
        .addFields(
          {
            name: '👤 Nome',
            value: client.user.username,
            inline: true,
          },
          {
            name: '🆔 ID',
            value: client.user.id,
            inline: true,
          },
          {
            name: '📅 Criado em',
            value: `<t:${Math.floor(client.user.createdTimestamp / 1000)}:f>`,
            inline: true,
          },
          {
            name: '🌍 Servidores',
            value: client.guilds.cache.size.toString(),
            inline: true,
          },
          {
            name: '👥 Usuários',
            value: client.users.cache.size.toString(),
            inline: true,
          },
          {
            name: '📚 Comandos',
            value: new Set(Array.from(client.commands.values()).map(cmd => cmd.name)).size.toString(),
            inline: true,
          }
        )
        .setFooter({
          text: `Discord.js v${require('discord.js').version}`,
        });

      const guildInfoEmbed = new EmbedBuilder()
        .setColor('#ff9900')
        .setTitle('🏰 Informações do Servidor')
        .setThumbnail(guild.iconURL({ size: 512 }))
        .addFields(
          {
            name: '📛 Nome',
            value: guild.name,
            inline: true,
          },
          {
            name: '🆔 ID',
            value: guild.id,
            inline: true,
          },
          {
            name: '👑 Dono',
            value: `<@${guild.ownerId}>`,
            inline: true,
          },
          {
            name: '👥 Membros',
            value: guild.memberCount.toString(),
            inline: true,
          },
          {
            name: '💬 Canais',
            value: guild.channels.cache.size.toString(),
            inline: true,
          },
          {
            name: '📋 Funções',
            value: guild.roles.cache.size.toString(),
            inline: true,
          },
          {
            name: '📅 Criado em',
            value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:f>`,
            inline: false,
          }
        );

      await message.reply({
        embeds: [botInfoEmbed, guildInfoEmbed],
      });

    } catch (error) {
      console.error('Erro no comando info:', error);
      message.reply('❌ Ocorreu um erro ao executar o comando.');
    }
  }
};
