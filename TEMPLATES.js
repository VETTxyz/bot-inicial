/**
 * TEMPLATES DE EXEMPLO PARA CRIAR NOVOS COMANDOS
 * Copie e adapte conforme sua necessidade
 */

// ═══════════════════════════════════════════════════════════════
// TEMPLATE 1: COMANDO SIMPLES
// ═══════════════════════════════════════════════════════════════

/*
module.exports = {
  name: 'comando',
  description: 'Descrição do comando',
  aliases: ['alias1', 'alias2'],
  usage: 'comando [argumento]',
  category: 'category',
  cooldown: 3,

  async execute(message, args, client) {
    // Seu código aqui
    message.reply('Resposta!');
  }
};
*/

// ═══════════════════════════════════════════════════════════════
// TEMPLATE 2: COMANDO COM VALIDAÇÃO
// ═══════════════════════════════════════════════════════════════

/*
module.exports = {
  name: 'comando',
  description: 'Descrição do comando',
  
  async execute(message, args, client) {
    // Valida argumentos
    if (args.length === 0) {
      return message.reply('❌ Use: `-comando [argumento]`');
    }

    const argumento = args.join(' ');
    message.reply(`Você escreveu: ${argumento}`);
  }
};
*/

// ═══════════════════════════════════════════════════════════════
// TEMPLATE 3: COMANDO COM EMBED
// ═══════════════════════════════════════════════════════════════

/*
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'comando',
  description: 'Descrição do comando',

  async execute(message, args, client) {
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('Título')
      .setDescription('Descrição')
      .addFields(
        { name: 'Campo 1', value: 'Valor 1' },
        { name: 'Campo 2', value: 'Valor 2' }
      );

    message.reply({ embeds: [embed] });
  }
};
*/

// ═══════════════════════════════════════════════════════════════
// TEMPLATE 4: COMANDO COM MENÇÕES
// ═══════════════════════════════════════════════════════════════

/*
module.exports = {
  name: 'comando',
  description: 'Descrição do comando',

  async execute(message, args, client) {
    // Pega o primeiro usuário mencionado ou o autor
    const user = message.mentions.users.first() || message.author;
    
    message.reply(`Você interagiu com: ${user.tag}`);
  }
};
*/

// ═══════════════════════════════════════════════════════════════
// TEMPLATE 5: COMANDO COM PERMISSÕES
// ═══════════════════════════════════════════════════════════════

/*
const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'comando',
  description: 'Descrição do comando',

  async execute(message, args, client) {
    // Verifica se o usuário tem permissão
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply('❌ Você não tem permissão para usar este comando.');
    }

    message.reply('✅ Comando executado com sucesso!');
  }
};
*/

// ═══════════════════════════════════════════════════════════════
// TEMPLATE 6: COMANDO COM INTERAÇÃO DE REAÇÃO
// ═══════════════════════════════════════════════════════════════

/*
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'comando',
  description: 'Descrição do comando',

  async execute(message, args, client) {
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('Escolha uma opção')
      .setDescription('Clique em uma reação para escolher');

    const msg = await message.reply({ embeds: [embed] });
    
    // Adiciona reações
    await msg.react('👍');
    await msg.react('👎');

    // Cria um filtro de reações
    const filter = (reaction, user) => !user.bot && msg.id === reaction.message.id;
    
    // Aguarda reação
    const collected = await msg.awaitReactions({ filter, max: 1, time: 60000 });

    if (collected.size === 0) {
      return message.reply('⏱️ Tempo expirado!');
    }

    const reaction = collected.first().emoji.name;
    message.reply(`Você escolheu: ${reaction}`);
  }
};
*/

// ═══════════════════════════════════════════════════════════════
// TEMPLATE 7: COMANDO ASSÍNCRONO (COM FETCH)
// ═══════════════════════════════════════════════════════════════

/*
module.exports = {
  name: 'comando',
  description: 'Descrição do comando',

  async execute(message, args, client) {
    try {
      // Faz uma requisição (exemplo)
      const response = await fetch('https://api.example.com/data');
      const data = await response.json();

      message.reply(`Dados: ${JSON.stringify(data)}`);
    } catch (error) {
      console.error(error);
      message.reply('❌ Erro ao buscar dados.');
    }
  }
};
*/

// ═══════════════════════════════════════════════════════════════
// TEMPLATE 8: COMANDO COM ARGUMENTOS OPCIONAIS
// ═══════════════════════════════════════════════════════════════

/*
module.exports = {
  name: 'comando',
  description: 'Descrição do comando',

  async execute(message, args, client) {
    const arg1 = args[0];
    const arg2 = args[1] || 'padrão';
    const arg3Rest = args.slice(2).join(' ') || 'nada';

    message.reply(`
arg1: ${arg1}
arg2: ${arg2}
arg3+: ${arg3Rest}
    `);
  }
};
*/

// ═══════════════════════════════════════════════════════════════
// TEMPLATE 9: COMANDO QUE EDITA MENSAGEM
// ═══════════════════════════════════════════════════════════════

/*
module.exports = {
  name: 'comando',
  description: 'Descrição do comando',

  async execute(message, args, client) {
    // Envia mensagem inicial
    const reply = await message.reply('Processando...');

    // Simula processamento
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Edita a mensagem
    reply.edit('✅ Processamento concluído!');
  }
};
*/

// ═══════════════════════════════════════════════════════════════
// TEMPLATE 10: COMANDO COM PAGINAÇÃO
// ═══════════════════════════════════════════════════════════════

/*
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  name: 'comando',
  description: 'Descrição do comando',

  async execute(message, args, client) {
    const pages = [
      new EmbedBuilder().setDescription('Página 1'),
      new EmbedBuilder().setDescription('Página 2'),
      new EmbedBuilder().setDescription('Página 3'),
    ];

    let page = 0;

    const buttons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('prev')
          .setLabel('◀ Anterior')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('next')
          .setLabel('Próximo ▶')
          .setStyle(ButtonStyle.Primary)
      );

    const msg = await message.reply({ embeds: [pages[page]], components: [buttons] });

    const collector = msg.createButtonCollector({ time: 60000 });

    collector.on('collect', async (interaction) => {
      if (interaction.user.id !== message.author.id) {
        return interaction.reply({ content: '❌ Você não pode usar estes botões.', ephemeral: true });
      }

      if (interaction.customId === 'prev') page = Math.max(0, page - 1);
      if (interaction.customId === 'next') page = Math.min(pages.length - 1, page + 1);

      await interaction.update({ embeds: [pages[page]] });
    });
  }
};
*/

module.exports = {
  info: '✅ Use os templates acima como base para criar seus próprios comandos!'
};
