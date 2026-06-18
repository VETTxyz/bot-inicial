const {
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require('discord.js');
const { getSession, updateSession, deleteSession } = require('./embedPanelStore');
const { buildPanelEmbed, buildPanelComponents, PANEL_PREFIX } = require('./embedPanelUtils');

const editableFields = new Set([
  'title',
  'description',
  'color',
  'author',
  'footer',
  'thumbnail',
  'image',
]);

function parseCustomId(customId) {
  const parts = customId.split(':');
  if (parts.length < 3) return null;
  const prefix = parts[0];
  const action = parts[1];
  const panelId = parts.slice(2).join(':');
  return { prefix, action, panelId };
}

function buildModal(action, panelId) {
  const modal = new ModalBuilder().setCustomId(`${PANEL_PREFIX}_modal:${action}:${panelId}`);

  if (action === 'addfield') {
    modal.setTitle('Adicionar campo ao embed');
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('field_name')
          .setLabel('Nome do campo')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('field_value')
          .setLabel('Valor do campo')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('field_inline')
          .setLabel('Inline? digite true ou false')
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
      )
    );
    return modal;
  }

  const labels = {
    title: 'Título do embed',
    description: 'Descrição do embed',
    color: 'Cor (hex ou alias)',
    author: 'Nome do autor',
    footer: 'Texto do rodapé',
    thumbnail: 'URL da thumbnail',
    image: 'URL da imagem',
  };

  const placeholder = {
    title: 'Ex: Novo anúncio',
    description: 'Ex: Este é o conteúdo principal do embed',
    color: 'Ex: #0099ff ou success',
    author: 'Ex: Equipe do servidor',
    footer: 'Ex: Criado por @mod',
    thumbnail: 'Ex: https://i.imgur.com/xxx.png',
    image: 'Ex: https://i.imgur.com/xxx.png',
  };

  modal.setTitle(`Editar ${labels[action] || action}`);
  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('value')
        .setLabel(labels[action] || 'Valor')
        .setStyle(action === 'description' ? TextInputStyle.Paragraph : TextInputStyle.Short)
        .setRequired(action !== 'color' ? true : false)
        .setPlaceholder(placeholder[action] || '')
    )
  );

  return modal;
}

function normalizeBoolean(value) {
  return /^(true|yes|1|on)$/i.test(String(value).trim());
}

function parseFieldInline(value) {
  if (!value) return false;
  return normalizeBoolean(value);
}

async function updatePanelMessage(interaction, session) {
  const channel = await interaction.client.channels.fetch(session.channelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return;

  const message = await channel.messages.fetch(session.messageId).catch(() => null);
  if (!message) return;

  await message.edit({
    embeds: [buildPanelEmbed(session.options)],
    components: buildPanelComponents(session.panelId),
  }).catch(() => null);
}

async function handleButtonInteraction(interaction) {
  const parsed = parseCustomId(interaction.customId);
  if (!parsed || parsed.prefix !== PANEL_PREFIX) return false;

  const session = getSession(parsed.panelId);
  if (!session) {
    await interaction.reply({ content: '⚠️ Painel expirado ou não encontrado.', ephemeral: true });
    return true;
  }

  if (interaction.user.id !== session.userId) {
    await interaction.reply({ content: '❌ Apenas o criador deste painel pode usá-lo.', ephemeral: true });
    return true;
  }

  const action = parsed.action;

  if (action === 'timestamp') {
    const nextValue = !session.options.timestamp;
    updateSession(session.panelId, { options: { ...session.options, timestamp: nextValue } });
    session.options.timestamp = nextValue;
    await interaction.update({
      embeds: [buildPanelEmbed(session.options)],
      components: buildPanelComponents(session.panelId),
    });
    return true;
  }

  if (action === 'send') {
    const embed = buildPanelEmbed(session.options);
    await interaction.reply({ content: '✅ Embed enviado com sucesso!', ephemeral: true });
    await interaction.channel.send({ embeds: [embed] });
    deleteSession(session.panelId);
    const panelMessage = await interaction.channel.messages.fetch(session.messageId).catch(() => null);
    if (panelMessage) {
      const disabledRows = buildPanelComponents(session.panelId).map(row => {
        row.components.forEach(component => component.setDisabled(true));
        return row;
      });
      await panelMessage.edit({
        embeds: [buildPanelEmbed(session.options)],
        components: disabledRows,
      }).catch(() => null);
    }
    return true;
  }

  if (editableFields.has(action) || action === 'addfield') {
    const modal = buildModal(action, session.panelId);
    await interaction.showModal(modal);
    return true;
  }

  await interaction.reply({ content: '⚠️ Ação do painel inválida.', ephemeral: true });
  return true;
}

async function handleModalSubmit(interaction) {
  const parsed = parseCustomId(interaction.customId);
  if (!parsed || parsed.prefix !== `${PANEL_PREFIX}_modal`) return false;

  const session = getSession(parsed.panelId);
  if (!session) {
    await interaction.reply({ content: '⚠️ Painel expirado ou não encontrado.', ephemeral: true });
    return true;
  }

  if (interaction.user.id !== session.userId) {
    await interaction.reply({ content: '❌ Apenas o criador deste painel pode enviar dados.', ephemeral: true });
    return true;
  }

  const action = parsed.action;
  const values = interaction.fields;
  const updatedOptions = { ...session.options };

  if (action === 'color') {
    const colorValue = values.getTextInputValue('value').trim();
    const { isValidColor } = require('./embedPanelUtils');

    if (!isValidColor(colorValue)) {
      await interaction.reply({ content: '⚠️ Cor inválida. Use um valor hexadecimal como `#0099ff` ou um alias válido.', ephemeral: true });
      return true;
    }

    updatedOptions.color = colorValue;
    updateSession(session.panelId, { options: updatedOptions });
    await interaction.reply({ content: '✅ Cor atualizada.', ephemeral: true });
    await updatePanelMessage(interaction, { ...session, options: updatedOptions });
    return true;
  }

  if (editableFields.has(action)) {
    updatedOptions[action] = values.getTextInputValue('value');
    updateSession(session.panelId, { options: updatedOptions });
    await interaction.reply({ content: `✅ ${action.charAt(0).toUpperCase() + action.slice(1)} atualizado.`, ephemeral: true });
    await updatePanelMessage(interaction, { ...session, options: updatedOptions });
    return true;
  }

  if (action === 'addfield') {
    const name = values.getTextInputValue('field_name');
    const value = values.getTextInputValue('field_value');
    const inline = parseFieldInline(values.getTextInputValue('field_inline'));

    if (!updatedOptions.fields) {
      updatedOptions.fields = [];
    }
    if (updatedOptions.fields.length >= 10) {
      await interaction.reply({ content: '⚠️ Limite de 10 campos atingido.', ephemeral: true });
      return true;
    }

    updatedOptions.fields = [...updatedOptions.fields, { name, value, inline }];
    updateSession(session.panelId, { options: updatedOptions });
    await interaction.reply({ content: '✅ Campo adicionado ao embed.', ephemeral: true });
    await updatePanelMessage(interaction, { ...session, options: updatedOptions });
    return true;
  }

  await interaction.reply({ content: '⚠️ Modal inválido.', ephemeral: true });
  return true;
}

module.exports = {
  handleButtonInteraction,
  handleModalSubmit,
};
