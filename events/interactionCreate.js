const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const path = require('path');
const { handleButtonInteraction, handleModalSubmit } = require('../utils/embedPanelHandler');
const { RULE_DETAILS, buildDetailPanel } = require('../utils/Rulesembed');
const { runCode, buildResultEmbed, buildErrorEmbed } = require('../utils/codeRunner');
const runCache = require('../utils/runCache');

// ID do cargo que será aplicado ao aceitar as regras
const ACCEPT_ROLE_ID = process.env.ACCEPT_ROLE_ID || 'SEU_ROLE_ID_AQUI';
const GITHUB_GIST_TOKEN = process.env.GITHUB_GIST_TOKEN || null;

function resultActionRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('run_again').setLabel('🔁 Rodar de novo').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('share_gist').setLabel('📤 Compartilhar como gist').setStyle(ButtonStyle.Secondary)
  );
}

async function executeAndReply(interaction, language, code, { updateMessage = false } = {}) {
  let embed;
  try {
    const result = await runCode(language, code);
    embed = buildResultEmbed(result);
  } catch (err) {
    embed = buildErrorEmbed(err);
  }

  const payload = { embeds: [embed], components: [resultActionRow()] };

  if (updateMessage && interaction.isMessageComponent()) {
    const message = await interaction.message.edit(payload);
    if (message?.id) runCache.set(message.id, { language, code });
    return message;
  }

  if (interaction.deferred || interaction.replied) {
    const message = await interaction.editReply(payload);
    if (message?.id) runCache.set(message.id, { language, code });
    return message;
  }

  const message = await interaction.reply({ ...payload, fetchReply: true });
  if (message?.id) runCache.set(message.id, { language, code });
  return message;
}

async function createGist(language, code) {
  const extensionByLanguage = {
    javascript: 'js',
    typescript: 'ts',
    python: 'py',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    csharp: 'cs',
    go: 'go',
    rust: 'rs',
    php: 'php',
    ruby: 'rb',
    bash: 'sh',
    kotlin: 'kt',
    swift: 'swift',
    lua: 'lua',
  };
  const filename = `snippet.${extensionByLanguage[language] || 'txt'}`;

  const res = await fetch('https://api.github.com/gists', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GITHUB_GIST_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      description: `Código rodado via /run (${language})`,
      public: false,
      files: { [filename]: { content: code } },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`GitHub respondeu ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data.html_url;
}

module.exports = {
  name: Events.InteractionCreate,
  async execute(client, interaction) {
    // ===== Slash Commands =====
    if (interaction.isChatInputCommand && interaction.isChatInputCommand()) {
      const slashCommandsPath = path.join(__dirname, '../slashcommands');

      function findCommand(dir, name) {
        const fs = require('fs');
        const files = fs.readdirSync(dir);

        for (const file of files) {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);

          if (stat.isDirectory()) {
            const found = findCommand(filePath, name);
            if (found) return found;
          } else if (file.endsWith('.js')) {
            try {
              delete require.cache[require.resolve(filePath)];
              const command = require(filePath);
              if (command.data?.name === name) {
                return command;
              }
            } catch (error) {
              console.error(`❌ Erro ao carregar comando ${file}:`, error.message);
            }
          }
        }
        return null;
      }

      const command = findCommand(slashCommandsPath, interaction.commandName);
      if (!command) {
        return interaction.reply({ content: '❌ Comando não encontrado.', ephemeral: true });
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(`❌ Erro ao executar comando ${interaction.commandName}:`, error);
        const reply = {
          content: '❌ Houve um erro ao executar este comando.',
          ephemeral: true,
        };
        return interaction.replied ? interaction.followUp(reply) : interaction.reply(reply);
      }
      return;
    }

    // ===== Modal de submit =====
    if (interaction.isModalSubmit && interaction.isModalSubmit()) {
      if (interaction.customId === 'run_modal') {
        await interaction.deferReply();
        const language = interaction.fields.getTextInputValue('run_language');
        const code = interaction.fields.getTextInputValue('run_code');
        return executeAndReply(interaction, language, code);
      }

      const handled = await handleModalSubmit(interaction);
      if (handled) return;
      return;
    }

    // ===== Botões =====
    if (interaction.isButton && interaction.isButton()) {
      const handled = await handleButtonInteraction(interaction);
      if (handled) return;

      if (interaction.customId === 'run_again') {
        const cached = runCache.get(interaction.message.id);
        if (!cached) {
          return interaction.reply({
            content: '⚠️ Não achei o código original (talvez o bot tenha reiniciado). Use `/run` de novo.',
            ephemeral: true,
          });
        }
        await interaction.deferUpdate();
        return executeAndReply(interaction, cached.language, cached.code, { updateMessage: true });
      }

      if (interaction.customId === 'share_gist') {
        const cached = runCache.get(interaction.message.id);
        if (!cached) {
          return interaction.reply({
            content: '⚠️ Não achei o código original pra compartilhar.',
            ephemeral: true,
          });
        }
        if (!GITHUB_GIST_TOKEN) {
          return interaction.reply({
            content: '⚠️ Esse recurso precisa de um `GITHUB_GIST_TOKEN` configurado no bot (token com escopo `gist`).',
            ephemeral: true,
          });
        }
        await interaction.deferReply({ ephemeral: true });
        try {
          const url = await createGist(cached.language, cached.code);
          return interaction.editReply({ content: `📤 Gist criado: ${url}` });
        } catch (err) {
          return interaction.editReply({ content: `❌ Não consegui criar o gist: ${err.message}` });
        }
      }

      if (RULE_DETAILS[interaction.customId]) {
        return interaction.reply({ ...buildDetailPanel(interaction.customId), ephemeral: true });
      }

      if (interaction.customId === 'accept_rules') {
        try {
          if (ACCEPT_ROLE_ID !== 'SEU_ROLE_ID_AQUI') {
            await interaction.member.roles.add(ACCEPT_ROLE_ID);
          }
          return interaction.reply({
            content: '✅ Regras aceitas! Bem-vindo(a) ao servidor.',
            ephemeral: true,
          });
        } catch (err) {
          console.error(err);
          return interaction.reply({
            content: '⚠️ Não consegui aplicar o cargo. Avise um administrador.',
            ephemeral: true,
          });
        }
      }

      if (interaction.customId === 'open_ticket') {
        return interaction.reply({
          content: '🎫 Abra um ticket no canal de suporte ou aguarde um membro da staff.',
          ephemeral: true,
        });
      }

      if (interaction.customId === 'verificar_exe_profile') {
        if (!interaction.guild) {
          return interaction.reply({ content: '❌ Este botão só funciona em servidores.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });
        try {
          const members = await interaction.guild.members.fetch().catch(() => interaction.guild.members.cache);
          const matched = members.filter(member => {
            const username = member.user.username.toLowerCase();
            const tag = member.user.tag.toLowerCase();
            return username.includes('.exe') || tag.includes('.exe');
          });

          if (!matched.size) {
            return interaction.editReply('❌ Não encontrei nenhum membro com `.exe` no nome ou na tag.');
          }

          const results = matched.map(member => `• ${member.user.tag} (${member.id})`);
          const displayed = results.slice(0, 20);
          const remaining = matched.size - displayed.length;

          const responseEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('✅ Membros com .exe')
            .setDescription(displayed.join('\n'))
            .setFooter({ text: `Total encontrado: ${matched.size}${remaining > 0 ? ` • exibindo 20 primeiros...` : ''}` });

          if (remaining > 0) {
            responseEmbed.addFields({
              name: 'Observação',
              value: `Ainda há mais ${remaining} membro(s) que não foram listados aqui.`,
            });
          }

          await interaction.editReply({ embeds: [responseEmbed] });
        } catch (error) {
          console.error('Erro ao processar interação de verificar .exe:', error);
          await interaction.editReply('❌ Ocorreu um erro ao verificar o perfil. Tente novamente mais tarde.');
        }
      }
      return;
    }

    return;
  },
};
