const { EmbedBuilder, SectionBuilder, TextDisplayBuilder, ThumbnailBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags} = require('discord.js');
const { parseEmbedArgs } = require('../utils/embedParser');

module.exports = {
  name: 'embedcp',
  description: 'Cria um embed totalmente personalizável usando opções em linha.',
  aliases: ['perfil', 'perfilzudo', 'embedzudo'],
  cooldown: 5,

  async execute(message, args) {
let membro;
 
  if (message.mentions.members.size > 0) {
    membro = message.mentions.members.first();
  } else if (args[0]) {
    try {
      membro = await message.guild.members.fetch(args[0]);
    } catch {
      return message.reply("❌ Membro não encontrado.");
    }
  } else {
    membro = message.member;
  }
 
  const usuario = membro.user;
 
  // ── Dados do perfil (substitua pela sua lógica de banco de dados) ──────────
  const status = "🔴 Ocupado";
  const entrou = `<t:${Math.floor(membro.joinedTimestamp / 1000)}:R>`;
  const criou  = `<t:${Math.floor(usuario.createdTimestamp / 1000)}:R>`;
 
  const cargos = membro.roles.cache
    .filter((r) => r.id !== message.guild.id)
    .map((r) => `<@&${r.id}>`)
    .slice(0, 5)
    .join(", ") || "Nenhum cargo";
 
  // Estatísticas fictícias — conecte ao seu banco de dados
  const stats = {
    mensagens:  4028,
    moedas:      546,
    conquistas:   13,
    compras:       8,
  };
 
  // ─── Cabeçalho ────────────────────────────────────────────────────────────
  const cabecalho = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`## <:discotoolsxyzicon4:1515250351362805820> Perfil de ${usuario.displayName}`),
      new TextDisplayBuilder().setContent(`<@${usuario.id}> \`@${usuario.username}\``)
    )
    .setThumbnailAccessory(
      new ThumbnailBuilder({
        media: { url: usuario.displayAvatarURL({ size: 128, extension: "png" }) },
      })
    );
 
  // ─── Informações gerais ───────────────────────────────────────────────────
  const infoGeral = new TextDisplayBuilder().setContent(
    [
      `<:discotoolsxyzicon5:1515250717047394535> **Status:** ${status}`,
      `<:discotoolsxyzicon6:1515250824346079284> **Entrou no servidor:** ${entrou}`,
      `<:discotoolsxyzicon7:1515250971050115102> **Conta criada:** ${criou}`,
    ].join("\n")
  );
 
  // ─── Cargos ───────────────────────────────────────────────────────────────
  const tituloCargos = new TextDisplayBuilder().setContent(`**@ Cargos**`);
  const listaCargos  = new TextDisplayBuilder().setContent(
    `${cargos}\n-# Inclui todos os cargos deste membro`
  );
 
  // ─── Estatísticas ─────────────────────────────────────────────────────────
  const tituloStats = new TextDisplayBuilder().setContent(`**📊 Estatísticas**`);
  const descStats   = new TextDisplayBuilder().setContent(
    `-# Informações sobre algumas estatísticas comuns deste membro`
  );
  const listaStats  = new TextDisplayBuilder().setContent(
    [
      `> 📨 **Mensagens enviadas:** ${stats.mensagens.toLocaleString("pt-BR")}`,
      `> 🪙 **Moedas:** ${stats.moedas}`,
      `> 🏆 **Conquistas:** ${stats.conquistas}`,
      `> 🛒 **Compras:** ${stats.compras}`,
    ].join("\n")
  );
 
  // ─── Rodapé + Botões ──────────────────────────────────────────────────────
  const rodape = new TextDisplayBuilder().setContent(
    `-# Painel de controle do perfil de ${usuario.displayName}`
  );
 
  const botoesRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`refresh_${usuario.id}`)
      .setEmoji(`<:discotoolsxyzicon16:1515253046391607326>`)
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`castigo_${usuario.id}`)
      .setLabel("Castigo")
      .setEmoji(`<:discotoolsxyzicon17:1515253476886581310>`)
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`expulsar_${usuario.id}`)
      .setLabel("Expulsar")
      .setEmoji(`<:discotoolsxyzicon13:1515252432299491328>`)
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`banir_${usuario.id}`)
      .setLabel("Banir")
      .setEmoji(`<:discotoolsxyzicon14:1515252807698087986>`)
      .setStyle(ButtonStyle.Secondary)
  );
 
  // ─── Container principal ──────────────────────────────────────────────────
  const sep = () =>
    new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small);
 
  const container = new ContainerBuilder()
    .setAccentColor(0xe91e8c)
    .addSectionComponents(cabecalho)
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(false).setSpacing(SeparatorSpacingSize.Small)
    )
    .addTextDisplayComponents(infoGeral)
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(tituloCargos, listaCargos)
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(tituloStats, descStats, listaStats)
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(rodape)
    .addActionRowComponents(botoesRow);
 
  await message.channel.send({
    components: [container],
    flags: MessageFlags.IsComponentsV2,
  });
}
}
