const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require('discord.js');
const { createSession } = require('../utils/embedPanelStore');

const PANEL_ID = 'embed_panel';
const optionFields = [
  { id: 'title', label: 'Título', style: 'SECONDARY' },
  { id: 'description', label: 'Descrição', style: 'SECONDARY' },
  { id: 'color', label: 'Cor', style: 'SECONDARY' },
  { id: 'author', label: 'Autor', style: 'SECONDARY' },
  { id: 'footer', label: 'Rodapé', style: 'SECONDARY' },
  { id: 'thumbnail', label: 'Thumbnail', style: 'SECONDARY' },
  { id: 'image', label: 'Imagem', style: 'SECONDARY' },
  { id: 'timestamp', label: 'Timestamp', style: 'SECONDARY' },
  { id: 'addfield', label: 'Adicionar campo', style: 'SUCCESS' },
  { id: 'send', label: 'Enviar embed', style: 'PRIMARY' },
];

function buildPanelEmbed(options) {
  const embed = new EmbedBuilder()
    .setColor(options.color || '#0099ff')
    .setTitle(options.title || 'Painel de criação de embed')
    .setDescription(options.description || 'Use os botões abaixo para personalizar cada parte do embed antes de enviar.')
    .setFooter({ text: options.footer || 'Clique em um botão para editar' });

  if (options.author) {
    embed.setAuthor({ name: options.author });
  }
  if (options.thumbnail) {
    embed.setThumbnail(options.thumbnail);
  }
  if (options.image) {
    embed.setImage(options.image);
  }
  if (options.timestamp) {
    embed.setTimestamp();
  }

  if (options.fields && options.fields.length > 0) {
    embed.addFields(options.fields.slice(0, 5));
  }

  return embed;
}

function buildPanelComponents(panelId) {
  const rows = [];
  let currentRow = new ActionRowBuilder();

  optionFields.forEach((field, index) => {
    const button = new ButtonBuilder()
      .setCustomId(`${PANEL_ID}:${field.id}:${panelId}`)
      .setLabel(field.label)
      .setStyle(ButtonStyle[field.style]);

    currentRow.addComponents(button);

    if ((index + 1) % 5 === 0 || index === optionFields.length - 1) {
      rows.push(currentRow);
      currentRow = new ActionRowBuilder();
    }
  });

  return rows;
}

module.exports = {
  name: 'embedpanel',
  description: 'Abre um painel interativo para criar um embed com botões.',
  aliases: ['paineldeembed', 'embedpanel'],
  usage: 'embedpanel',
  category: 'utility',
  cooldown: 10,

  async execute(message) {
    const options = {
      title: null,
      description: null,
      color: null,
      author: null,
      footer: null,
      thumbnail: null,
      image: null,
      timestamp: false,
      fields: [],
    };

    const reply = await message.reply({
      embeds: [buildPanelEmbed(options)],
    });

    const panelId = reply.id;

    await reply.edit({
      components: buildPanelComponents(panelId),
    });

    createSession(
      panelId,
      message.author.id,
      message.channel.id,
      reply.id,
      options
    );
  },
};
