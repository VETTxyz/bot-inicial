const { EmbedBuilder } = require('discord.js');
const { parseEmbedArgs } = require('../utils/embedParser');

module.exports = {
  name: 'embed',
  description: 'Cria um embed totalmente personalizável usando opções em linha.',
  aliases: ['embedcreate', 'criaembed'],
  usage: 'embed title:"Título" description:"Descrição" color:"#0099ff" footer:"Rodapé" author:"Autor" author_icon:"URL" thumbnail:"URL" image:"URL" timestamp:true field:"Nome" value:"Valor" inline:true',
  examples: [
    'embed title:"Boas-vindas" description:"Seja bem-vindo ao servidor!" color:info footer:"Seja gentil" timestamp:true',
    'embed title:"Aviso" description:"Leia as regras antes de continuar." color:#ff0000 footer:"Equipe de moderação" field:"Regra 1" value:"Sem spam" inline:true field:"Regra 2" value:"Respeite todos" inline:true',
    'embed message:"Confira o embed abaixo:" title:"Novidade" description:"Atualização do servidor disponível." color:success thumbnail:"https://i.imgur.com/xyz.png" image:"https://i.imgur.com/abc.png"',
  ],
  category: 'utility',
  cooldown: 5,

  async execute(message, args) {
    const PREFIX = process.env.PREFIX || '-';
    const rawContent = message.content.slice(PREFIX.length).trim();
    const commandName = args.shift() || '';
    const rawInput = rawContent.slice(commandName.length).trim();

    if (!rawInput) {
      return message.reply({
        content:
          '❌ Use o comando `embed` com opções de criação. Exemplo: `-embed title:"Titulo" description:"Texto" color:info footer:"Rodapé"`',
      });
    }

    const { options, errors } = parseEmbedArgs(rawInput);

    if (errors.length > 0) {
      return message.reply({
        content: `❌ Erros ao processar o embed:\n${errors.join('\n')}`,
      });
    }

    const hasEmbedData =
      options.title ||
      options.description ||
      options.url ||
      options.footer ||
      options.author ||
      options.thumbnail ||
      options.image ||
      options.fields.length > 0 ||
      options.timestamp;

    if (!hasEmbedData) {
      return message.reply({
        content:
          '❌ Forneça pelo menos um parâmetro de embed como `title`, `description`, `color`, `footer`, `author`, `fields`, `thumbnail`, `image` ou `timestamp`.',
      });
    }

    const embed = new EmbedBuilder();

    if (options.title) embed.setTitle(options.title);
    if (options.description) embed.setDescription(options.description);
    if (options.url) embed.setURL(options.url);
    if (options.color) embed.setColor(options.color);
    if (options.author) {
      const authorData = { name: options.author };
      if (options.author_icon) authorData.iconURL = options.author_icon;
      if (options.author_url) authorData.url = options.author_url;
      embed.setAuthor(authorData);
    }

    if (options.footer) {
      const footerData = { text: options.footer };
      if (options.footer_icon) footerData.iconURL = options.footer_icon;
      embed.setFooter(footerData);
    }

    if (options.thumbnail) embed.setThumbnail(options.thumbnail);
    if (options.image) embed.setImage(options.image);
    if (options.timestamp) embed.setTimestamp(options.timestamp === true ? new Date() : options.timestamp);
    if (options.fields.length > 0) embed.addFields(options.fields);

    return message.reply({
      content: options.message || null,
      embeds: [embed],
    });
  },
};
