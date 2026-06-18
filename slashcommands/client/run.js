/**
 * commands/run.js
 * /run abre direto um modal — não dá pra usar option de slash command
 * pra texto longo com boa UX, então o modal resolve isso.
 */

const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('run')
    .setDescription('Executa um trecho de código e mostra o resultado'),

  async execute(interaction) {
    const modal = new ModalBuilder().setCustomId('run_modal').setTitle('Executar código');

    const languageInput = new TextInputBuilder()
      .setCustomId('run_language')
      .setLabel('Linguagem (ex: python, javascript, java, cpp)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('python')
      .setRequired(true);

    const codeInput = new TextInputBuilder()
      .setCustomId('run_code')
      .setLabel('Código')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('print("olá mundo")')
      .setMaxLength(3500)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(languageInput),
      new ActionRowBuilder().addComponents(codeInput)
    );

    await interaction.showModal(modal);
  },
};