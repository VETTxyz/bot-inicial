const { EmbedBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours}h ${minutes}m ${secs}s`;
}

module.exports = {
  name: 'callhours',
  description: 'Mostra o ranking de horas em call ou as horas totais de um usuário específico.',
  aliases: ['call', 'voicetime', 'vc', 'horas', 'callrank', 'topcalls'],
  usage: 'callhours [@usuário]',
  category: 'utility',
  cooldown: 5,

  async execute(message) {
    if (!message.guild) {
      return message.reply('❌ Use este comando apenas em servidores.');
    }

    const guildId = message.guild.id;
    const mention = message.mentions.users.first();
    const argId = message.content.split(/ +/)[1];
    const resolvedUserId = mention ? mention.id : argId?.replace(/[^0-9]/g, '');
    
    const allEntries = (await db.all()).filter(entry => entry.id.startsWith(`voiceTime_${guildId}_`) && entry.id.endsWith('_total'));

    if (!allEntries.length) {
      return message.reply('📞 Ainda não há horas em call registradas neste servidor.');
    }

    const members = await message.guild.members.fetch().catch(() => message.guild.members.cache);
    const validEntries = allEntries
      .map(entry => {
        const id = entry.id.split('_')[2];
        const member = members.get(id);
        if (!member || member.user.bot) return null;
        return {
          id,
          member,
          totalSeconds: Number(entry.value) || 0,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.totalSeconds - a.totalSeconds);

    const mentionedUser = resolvedUserId ? members.get(resolvedUserId)?.user : null;

    if (!validEntries.length) {
      return message.reply('📞 Nenhum usuário válido encontrado no ranking de horas em call.');
    }

    // Se um usuário foi mencionado, mostrar suas horas
    if (mentionedUser) {
      const userEntry = validEntries.find(entry => entry.id === mentionedUser.id);
      const rank = userEntry ? validEntries.indexOf(userEntry) + 1 : null;
      const totalHours = userEntry ? userEntry.totalSeconds : 0;
      
      const embed = new EmbedBuilder()
        .setColor('#9c27b0')
        .setTitle(`📞 Horas em Call de ${mentionedUser.username}`)
        .setThumbnail(mentionedUser.displayAvatarURL({ dynamic: true }))
        .setDescription(userEntry
          ? `${mentionedUser.toString()} está na posição **${rank}° lugar** com **${formatTime(totalHours)}** em call.`
          : `${mentionedUser.toString()} ainda não possui horas registradas em call.`)
        .addFields({
          name: '⏱️ Tempo Total',
          value: userEntry ? formatTime(totalHours) : 'Sem dados',
          inline: true,
        }, {
          name: '🏆 Posição',
          value: userEntry ? `#${rank}` : 'Sem rank',
          inline: true,
        })
        .setFooter({ text: 'Use -callhours sem mention para ver o ranking geral.' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    // Mostrar ranking geral
    const topList = validEntries.slice(0, 10);
    const description = topList
      .map((entry, index) => {
        const timeStr = formatTime(entry.totalSeconds);
        return `**${index + 1}.** ${entry.member.user.toString()} — **${timeStr}**`;
      })
      .join('\n');

    const embed = new EmbedBuilder()
      .setColor('#9c27b0')
      .setTitle('📞 Ranking de Horas em Call')
      .setDescription(description || 'Nenhum dado disponível')
      .addFields({
        name: '👥 Usuários Rankeados',
        value: `${validEntries.length}`,
        inline: true,
      }, {
        name: '⏱️ Tempo Total',
        value: formatTime(validEntries.reduce((sum, entry) => sum + entry.totalSeconds, 0)),
        inline: true,
      })
      .setFooter({ text: 'Use -call @usuário para ver os detalhes de um membro.' })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};
