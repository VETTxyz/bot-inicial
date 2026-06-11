const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'help',
  description: 'Mostra a lista de comandos disponíveis',
  aliases: ['h', 'ajuda', 'commands'],
  usage: 'help [comando]',
  category: 'utility',

  async execute(message, args, client) {
    const PREFIX = process.env.PREFIX || '-';

    try {
      if (args.length > 0) {
        const commandName = args[0].toLowerCase();
        const command = client.commands.get(commandName);

        if (!command) {
          return message.reply(`❌ Comando \`${commandName}\` não encontrado.`);
        }

        const commandEmbed = new EmbedBuilder()
          .setColor('#0099ff')
          .setTitle(`📖 Comando: ${command.name}`)
          .setDescription(command.description || 'Sem descrição')
          .addFields(
            {
              name: '📝 Uso',
              value: `\`${PREFIX}${command.usage || command.name}\``,
              inline: true,
            },
            {
              name: '⏱️ Cooldown',
              value: `${command.cooldown || 0}s`,
              inline: true,
            },
            {
              name: '🏷️ Categoria',
              value: command.category || 'Sem categoria',
              inline: true,
            }
          );

        if (command.aliases && command.aliases.length > 0) {
          commandEmbed.addFields({
            name: '📌 Aliases',
            value: command.aliases.map(alias => `\`${alias}\``).join(', '),
          });
        }

        return message.reply({ embeds: [commandEmbed] });
      }

      const commandsByCategory = {};
      const processedCommands = new Set();

      client.commands.forEach(command => {
        // Evita adicionar o mesmo comando múltiplas vezes (por aliases)
        if (processedCommands.has(command.name)) return;
        processedCommands.add(command.name);

        const category = command.category || 'Sem categoria';
        
        if (!commandsByCategory[category]) {
          commandsByCategory[category] = [];
        }

        commandsByCategory[category].push(command.name);
      });

      const helpEmbed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('📚 Menu de Ajuda')
        .setDescription(`Use \`${PREFIX}help [comando]\` para mais informações sobre um comando específico.`)
        .setFooter({
          text: `Total de comandos: ${Object.values(commandsByCategory).flat().length}`,
        });

      // Adiciona as categorias
      for (const [category, commands] of Object.entries(commandsByCategory)) {
        helpEmbed.addFields({
          name: `📂 ${category}`,
          value: commands.map(cmd => `\`${PREFIX}${cmd}\``).join(', '),
          inline: false,
        });
      }

      await message.reply({ embeds: [helpEmbed] });

    } catch (error) {
      console.error('Erro no comando help:', error);
      message.reply('❌ Ocorreu um erro ao executar o comando.');
    }
  }
};
