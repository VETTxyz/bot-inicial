const { Client, GatewayIntentBits } = require('discord.js');
const config = require('./config');
const commandHandler = require('./handlers/commandHandler');
const eventHandler = require('./handlers/eventHandler');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
});

console.log('\n╔════════════════════════════════════════════════╗');
console.log('║       🤖 INICIANDO BOT 🤖        ║');
console.log('╚════════════════════════════════════════════════╝\n');
commandHandler(client);

eventHandler(client);

process.on('uncaughtException', (error) => {
  console.error('❌ Erro não capturado:');
  console.error(error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada não tratada:');
  console.error(reason);
});

const token = process.env.TOKEN || config.token;

if (!token || token === 'seu_token_aqui') {
  console.error('❌ ERRO: Token não configurado!');
  console.error('Defina a variável de ambiente TOKEN com seu token do bot.');
  process.exit(1);
}


client.login(token).catch(error => {
  console.error('❌ Erro ao fazer login do bot:');
  console.error(error);
  process.exit(1);
});


module.exports = client;
