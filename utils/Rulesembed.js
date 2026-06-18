/**
 * utils/rulesEmbed.js
 * Lógica de montagem dos painéis de regras (Components V2).
 * Importado tanto pelo comando /regras quanto pelo handler de interactionCreate.
 */

const {
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  AttachmentBuilder,
  MessageFlags,
} = require('discord.js');

const ACCENT_COLOR = 0xff6a00; // laranja

const RULE_DETAILS = {
  rule_geral: {
    label: '・Regras Gerais',
    summary: 'Respeito, conduta e convivência básica.',
    content:
      '## 📜 | Regras Gerais\n' +
      '- Respeite todos os membros, independente de opinião, gênero, religião ou orientação;\n' +
      '- Qualquer tipo de preconceito (racismo, homofobia, etc.) resulta em banimento imediato;\n' +
      '- Mantenha as conversas dentro do propósito de cada canal;\n' +
      '- Siga também os Termos de Serviço e as Diretrizes da Comunidade do Discord;\n' +
      '- A staff pode advertir, mutar, kickar ou banir a qualquer momento, conforme necessário.',
    style: ButtonStyle.Primary,
  },
  rule_chat: {
    label: '・Regras de Chat',
    summary: 'Como usar o chat de texto corretamente.',
    content:
      '## 💬 | Regras de Chat\n' +
      '- Sem spam, flood ou mensagens repetidas;\n' +
      '- Proibido conteúdo NSFW, gore ou chocante em canais públicos;\n' +
      '- Links de convite só com permissão da staff;\n' +
      '- Discussões políticas/religiosas apenas no canal próprio pra isso;\n' +
      '- Use o canal certo pra cada assunto (ajuda, off-topic, dúvidas, etc.).',
    style: ButtonStyle.Secondary,
  },
  rule_voz: {
    label: '・Regras de Voz',
    summary: 'Conduta nos canais de voz.',
    content:
      '## 🎙️ | Regras de Voz\n' +
      '- Sem ruídos irritantes ou soundboard abusivo;\n' +
      '- Respeite quem está falando, evite interromper;\n' +
      '- Proibido entrar em call só pra perturbar (call hopping);\n' +
      '- Streaming de conteúdo impróprio é proibido;\n' +
      '- A staff pode mover ou desconectar em caso de comportamento tóxico.',
    style: ButtonStyle.Secondary,
  },
  rule_proibicoes: {
    label: '・Proibições',
    summary: 'O que é proibido em qualquer hipótese.',
    content:
      '## 🚫 | Proibições\n' +
      '- Divulgar outros servidores sem autorização;\n' +
      '- Engenharia social, phishing ou compartilhamento de malware;\n' +
      '- Multi-conta pra burlar punições;\n' +
      '- Venda/troca de itens ou contas fora das regras do servidor;\n' +
      '- Bots de automação não autorizados.',
    style: ButtonStyle.Secondary,
  },
  rule_punicoes: {
    label: '・Sistema de Punições',
    summary: 'Como funcionam as advertências e bans.',
    content:
      '## ⚖️ | Sistema de Punições\n' +
      '- **1ª vez:** advertência registrada;\n' +
      '- **2ª vez:** mute temporário (24h);\n' +
      '- **3ª vez:** kick do servidor;\n' +
      '- **Reincidência grave:** banimento permanente;\n' +
      '- **Casos graves** (ameaças, conteúdo ilegal): ban imediato, sem aviso prévio.',
    style: ButtonStyle.Secondary,
  },
  rule_cargos: {
    label: '・Cargos e Benefícios',
    summary: 'Cargos disponíveis e como conquistá-los.',
    content:
      '## 🎭 | Cargos e Benefícios\n' +
      '- Cargos de cor e destaque liberados por atividade;\n' +
      '- Cargo de Booster com canais, cores e badge exclusivos;\n' +
      '- Cargos sazonais em eventos e parcerias;\n' +
      '- A staff pode revisar cargos conforme o comportamento do membro.\n' +
      '- Cargos não garantem privilégios além dos listados, e podem ser removidos em caso de má conduta.\n' +
      '- Caso queira cargo de imagens no chat-geral: Use https://discord.gg/mdev em sua bio pra conseguir o cargo de imagem',
    style: ButtonStyle.Success,
  },
};

// Mensagem principal enviada por /regras
function buildRulesMessage() {
  const bannerAttachment = new AttachmentBuilder('./assets/banner.png', { name: 'banner.png' });

  const container = new ContainerBuilder()
    .setAccentColor(ACCENT_COLOR)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        '# 📜 | Regras mDev\n*Clique em "Ver detalhes" em cada bloco para abrir as regras completas daquela categoria.*'
      )
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    // troque por .setURL('https://seulink.com/banner.png') se preferir não subir arquivo
    .addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL('attachment://banner.png').setDescription('Banner das regras')
      )
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));

  for (const [customId, rule] of Object.entries(RULE_DETAILS)) {
    container.addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**${rule.label}**\n${rule.summary}`))
        .setButtonAccessory(new ButtonBuilder().setCustomId(customId).setLabel('Ver detalhes').setStyle(rule.style))
    );
  }

  container
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('-# Atualizado em 17/06/2026 • Ao participar, você concorda com todas as regras acima.')
    )
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('accept_rules').setLabel('✅ Aceitar as Regras').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('open_ticket').setLabel('🎫 Falar com a Staff').setStyle(ButtonStyle.Secondary)
      )
    );

  return {
    components: [container],
    files: [bannerAttachment],
    flags: MessageFlags.IsComponentsV2,
  };
}

// Painel ephemeral mostrado quando um botão "Ver detalhes" é clicado
function buildDetailPanel(customId) {
  const rule = RULE_DETAILS[customId];
  const container = new ContainerBuilder()
    .setAccentColor(ACCENT_COLOR)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(rule.content))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent('-# Só você está vendo esta mensagem.'));

  return {
    components: [container],
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
  };
}

module.exports = { RULE_DETAILS, buildRulesMessage, buildDetailPanel };