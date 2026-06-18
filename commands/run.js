/**
 * commands/run.js
 * Comando /run que abre um modal para o usuário enviar código para executar.
 *
 * O usuário entra a linguagem (ex: python, javascript, java) e o código.
 * Após enviar, a interação é processada em events/interactionCreate.js
 */

const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require('discord.js');

module.exports = {
  name: 'run',
  data: new SlashCommandBuilder()
    .setName('run')
    .setDescription('Executa um trecho de código em qualquer linguagem'),

  async execute(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('run_modal')
      .setTitle('Executar código');

    const languageInput = new TextInputBuilder()
      .setCustomId('run_language')
      .setLabel('Linguagem')
      .setPlaceholder('Ex: python, javascript, java, cpp, etc.')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const codeInput = new TextInputBuilder()
      .setCustomId('run_code')
      .setLabel('Código')
      .setPlaceholder('Cole seu código aqui...')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(languageInput),
      new ActionRowBuilder().addComponents(codeInput)
    );

    await interaction.showModal(modal);
  },
};
