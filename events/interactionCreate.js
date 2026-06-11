const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
  name: Events.InteractionCreate,
  async execute(client, interaction) {
    if (!interaction.isButton()) return;
    if (interaction.customId !== 'verificar_exe_profile') return;

    if (!interaction.guild) {
      return interaction.reply({ content: '❌ Este botão só funciona em servidores.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const members = await interaction.guild.members.fetch().catch(() => interaction.guild.members.cache);
      const matched = members.filter(member => {
        const username = member.user.username.toLowerCase();
        const tag = member.user.tag.toLowerCase();
        return username.includes('.exe') || tag.includes('.exe');
      });

      if (!matched.size) {
        return interaction.editReply('❌ Não encontrei nenhum membro com `.exe` no nome ou na tag.');
      }

      const results = matched.map(member => `• ${member.user.tag} (${member.id})`);
      const displayed = results.slice(0, 20);
      const remaining = matched.size - displayed.length;

      const responseEmbed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('✅ Membros com .exe')
        .setDescription(displayed.join('\n'))
        .setFooter({ text: `Total encontrado: ${matched.size}${remaining > 0 ? ` • exibindo 20 primeiros...` : ''}` });

      if (remaining > 0) {
        responseEmbed.addFields({
          name: 'Observação',
          value: `Ainda há mais ${remaining} membro(s) que não foram listados aqui.`,
        });
      }

      await interaction.editReply({ embeds: [responseEmbed] });
    } catch (error) {
      console.error('Erro ao processar interação de verificar .exe:', error);
      await interaction.editReply('❌ Ocorreu um erro ao verificar o perfil. Tente novamente mais tarde.');
    }
  },
};
