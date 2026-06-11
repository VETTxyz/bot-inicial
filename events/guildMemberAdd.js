const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
  name: Events.GuildMemberAdd,
  
  async execute(client, member) {
    try {
      console.log(`✅ ${member.user.tag} entrou no servidor ${member.guild.name}`);
      const welcomeChannelName = '💐・bem-vindos';
      const welcomeChannel = member.guild.channels.cache.find(
        ch => ch.name === welcomeChannelName
      );

      if (!welcomeChannel) {
        console.warn(`⚠️  Canal de boas-vindas '${welcomeChannelName}' não encontrado em ${member.guild.name}`);
        return;
      }

      const welcomeEmbed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('🎉 Boas-vindas!')
        .setDescription(`Seja muito bem-vindo ao **mDev**! Esperamos que você aproveite e faça parte da nossa comunidade.`)
        .setThumbnail(member.guild.iconURL({ dynamic: true }))
        .addFields(
          {
            name: '👤 Novo membro',
            value: member.user.tag,
            inline: true,
          },
          {
            name: '👥 Membros',
            value: `${member.guild.memberCount}`,
            inline: true,
          },
          {
            name: '📌 Próximo passo',
            value: 'Confira as regras e apresente-se nos canais indicados para começar com o pé direito.',
            inline: false,
          }
        )
        .setFooter({
          text: 'Que sua jornada aqui seja incrível!',
          iconURL: member.guild.iconURL({ dynamic: true }),
        })
        .setTimestamp();

      await welcomeChannel.send({
        embeds: [welcomeEmbed],
      });

    } catch (error) {
      console.error('❌ Erro no evento guildMemberAdd:', error);
    }
  }
};
