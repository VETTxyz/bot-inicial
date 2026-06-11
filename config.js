
module.exports = {
  prefix: process.env.PREFIX || '-',
  token: process.env.TOKEN,

  // Intents necessários para o bot funcionar
  intents: [
    'Guilds',
    'GuildMembers',
    'GuildMessages',
    'GuildVoiceStates',
    'DirectMessages',
    'MessageContent',
  ],

  colors: {
    success: '#00ff00',
    error: '#ff0000',
    info: '#0099ff',
    warning: '#ffaa00',
  },

  messages: {
    errorCommand: '❌ Ocorreu um erro ao executar este comando.',
    commandNotFound: '❌ Comando não encontrado. Use `-help` para ver os comandos disponíveis.',
    noPermission: '❌ Você não tem permissão para usar este comando.',
  },

  defaultCooldown: 3,

  logs: {
    enabled: true,
    showCommands: true,
    showEvents: true,
    showErrors: true,
  }
};
