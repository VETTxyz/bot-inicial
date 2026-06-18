const { SlashCommandBuilder } = require('discord.js');
const { buildRulesMessage } = require('../utils/rulesEmbed');
 
module.exports = {
  name: 'regras',
  description: 'Mostra as regras do servidor',
  aliases: ['rules', 'regras'],
  usage: 'regras',
  category: 'utility',
 
  async execute(interaction) {
    await interaction.reply(buildRulesMessage());
  },
};
 