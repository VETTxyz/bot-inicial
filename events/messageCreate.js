const { Events } = require('discord.js');
const PREFIX = process.env.PREFIX || '-';
const { QuickDB } = require('quick.db');
const db = new QuickDB();

const COMMAND_CLEANUP_CHANNEL_IDS = new Set([
  '1513117714246402268',
]);
const COMMAND_CLEANUP_DELAY_MS = 30 * 1000; // 30 segundos

function scheduleDeleteMessage(message, delay = COMMAND_CLEANUP_DELAY_MS) {
  setTimeout(() => {
    message.delete().catch(() => null);
  }, delay);
}

module.exports = {
  name: Events.MessageCreate,
  async execute(client, message) {
    if (message.author.bot) return;
    if (!message.guild) return;

    // Contagem de mensagens
    if (message.member && !message.member.user.bot) {
      const key = `messages_${message.guild.id}_${message.author.id}`;
      await db.add(key, 1);
    }

    if (!message.content.startsWith(PREFIX)) return;
    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command = client.commands.get(commandName);

    if (!command) {
      if (COMMAND_CLEANUP_CHANNEL_IDS.has(message.channel.id)) {
        scheduleDeleteMessage(message);
      }
      return;
    }

    if (!client.cooldowns.has(command.name)) {
      client.cooldowns.set(command.name, new Map());
    }

    const now = Date.now();
    const timestamps = client.cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 0) * 1000;

    if (timestamps.has(message.author.id)) {
      const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        const cooldownReply = await message.reply(
          `⏱️ Este comando está em cooldown. Tente novamente em \`${timeLeft.toFixed(1)}s\`.`
        );

        if (COMMAND_CLEANUP_CHANNEL_IDS.has(message.channel.id)) {
          scheduleDeleteMessage(message);
          scheduleDeleteMessage(cooldownReply);
        }

        return;
      }
    }

    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

    // Executa o comando
    try {
      const result = await command.execute(message, args, client);

      if (COMMAND_CLEANUP_CHANNEL_IDS.has(message.channel.id)) {
        scheduleDeleteMessage(message);

        if (result) {
          if (Array.isArray(result)) {
            result.forEach(replyMessage => {
              if (replyMessage?.delete) scheduleDeleteMessage(replyMessage);
            });
          } else if (result.delete) {
            scheduleDeleteMessage(result);
          }
        }
      }
    } catch (error) {
      console.error(`❌ Erro ao executar o comando ${command.name}:`);
      console.error(error);
      const errorReply = await message.reply({
        content: '❌ Ocorreu um erro ao executar este comando.',
        ephemeral: true,
      }).catch(err => {
        console.error(err);
        return null;
      });

      if (COMMAND_CLEANUP_CHANNEL_IDS.has(message.channel.id) && errorReply) {
        scheduleDeleteMessage(message);
        scheduleDeleteMessage(errorReply);
      }
    }
  }
};
