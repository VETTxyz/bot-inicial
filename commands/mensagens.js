const { EmbedBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
  name: 'mensagens',
  description: 'Mostra o ranking de mensagens ou o total de mensagens de um usuário mencionado.',
  aliases: ['msg', 'mensagem', 'rankmsg', 'topmsgs', 'contagem', 'profile'],
  usage: 'mensagens [@usuário]',
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
    const allEntries = (await db.all()).filter(entry => entry.id.startsWith(`messages_${guildId}_`));

    if (!allEntries.length) {
      return message.reply('📊 Ainda não há mensagens registradas neste servidor.');
    }

    const members = await message.guild.members.fetch().catch(() => message.guild.members.cache);
    const validEntries = allEntries
      .map(entry => {
        const id = entry.id.split('_').pop();
        const member = members.get(id);
        if (!member || member.user.bot) return null;
        return {
          id,
          member,
          count: Number(entry.value) || 0,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.count - a.count);

    const mentionedUser = resolvedUserId ? members.get(resolvedUserId)?.user : null;

    if (!validEntries.length) {
      return message.reply('📊 Nenhum usuário válido encontrado no ranking de mensagens.');
    }

    if (mentionedUser) {
      const userEntry = validEntries.find(entry => entry.id === mentionedUser.id);
      const rank = userEntry ? validEntries.indexOf(userEntry) + 1 : null;
      const count = userEntry ? userEntry.count : 0;
      
      // Obter dados de call
      const callHoursKey = `voiceTime_${guildId}_${mentionedUser.id}_total`;
      const callSeconds = (await db.get(callHoursKey)) || 0;
      const callHours = Math.floor(callSeconds / 3600);
      const callMinutes = Math.floor((callSeconds % 3600) / 60);
      
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`👤 Perfil de ${mentionedUser.username}`)
        .setThumbnail(mentionedUser.displayAvatarURL({ dynamic: true }))
        .setDescription(userEntry
          ? `${mentionedUser.toString()} está no ranking com as seguintes estatísticas:`
          : `${mentionedUser.toString()} ainda não possui dados registrados no ranking.`)
        .addFields(
          { name: '💬 Mensagens', value: `**${count}** mensagens\n📍 Posição: #${rank}`, inline: true },
          { name: '📞 Tempo em Call', value: `**${callHours}h ${callMinutes}m** em call`, inline: true }
        )
        .setFooter({ text: 'Use -mensagens para ver o ranking geral.' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    const topList = validEntries.slice(0, 10);
    const description = topList
      .map((entry, index) => {
        const callHoursKey = `voiceTime_${guildId}_${entry.id}_total`;
        return `**${index + 1}.** ${entry.member.user.toString()} \`${entry.count}📧\``;
      })
      .join('\n');

    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('📊 Ranking de Mensagens')
      .setDescription(description || 'Nenhum dado disponível')
      .addFields({
        name: '📈 Usuários Rankeados',
        value: `${validEntries.length} usuários`,
        inline: true,
      }, {
        name: '💬 Total de Mensagens',
        value: `${validEntries.reduce((sum, entry) => sum + entry.count, 0)} mensagens`,
        inline: true,
      })
      .setFooter({ text: 'Use -mensagens @usuário para ver o perfil completo de um membro.' })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};
