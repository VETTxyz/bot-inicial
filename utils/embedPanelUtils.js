const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require('discord.js');

const PANEL_PREFIX = 'embed_panel';

const optionButtons = [
  { id: 'title', label: 'Título', style: ButtonStyle.Secondary },
  { id: 'description', label: 'Descrição', style: ButtonStyle.Secondary },
  { id: 'color', label: 'Cor', style: ButtonStyle.Secondary },
  { id: 'author', label: 'Autor', style: ButtonStyle.Secondary },
  { id: 'footer', label: 'Rodapé', style: ButtonStyle.Secondary },
  { id: 'thumbnail', label: 'Thumbnail', style: ButtonStyle.Secondary },
  { id: 'image', label: 'Imagem', style: ButtonStyle.Secondary },
  { id: 'timestamp', label: 'Timestamp', style: ButtonStyle.Secondary },
  { id: 'addfield', label: 'Adicionar campo', style: ButtonStyle.Success },
  { id: 'send', label: 'Enviar embed', style: ButtonStyle.Primary },
];

function buildPanelEmbed(options) {
  const embed = new EmbedBuilder()
    .setColor(options.color || '#0099ff')
    .setTitle(options.title || 'Painel de criação de embed')
    .setDescription(
      options.description ||
        'Use os botões abaixo para editar o conteúdo do embed e clique em Enviar quando estiver pronto.'
    )
    .setFooter({ text: options.footer || 'Editor de embed interativo' });

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
    embed.addFields(options.fields.slice(0, 10));
  }

  return embed;
}

function buildPanelComponents(panelId) {
  const rows = [];
  let row = new ActionRowBuilder();

  optionButtons.forEach((button, index) => {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`${PANEL_PREFIX}:${button.id}:${panelId}`)
        .setLabel(button.label)
        .setStyle(button.style)
    );

    if ((index + 1) % 5 === 0 || index === optionButtons.length - 1) {
      rows.push(row);
      row = new ActionRowBuilder();
    }
  });

  return rows;
}

module.exports = {
  PANEL_PREFIX,
  buildPanelEmbed,
  buildPanelComponents,
};
