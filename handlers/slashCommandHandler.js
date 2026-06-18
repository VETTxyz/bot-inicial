const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

module.exports = (client) => {
  const slashCommandsPath = path.join(__dirname, '../slashcommands');
  const commands = [];

  // Função para carregar recursivamente todos os arquivos de slash commands
  function loadCommands(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        // Se for pasta, entra recursivamente
        loadCommands(filePath);
      } else if (file.endsWith('.js')) {
        try {
          delete require.cache[require.resolve(filePath)];
          const command = require(filePath);

          if (command.data) {
            commands.push(command.data.toJSON());
          }
        } catch (error) {
          console.error(`❌ Erro ao carregar slash command ${file}:`, error.message);
        }
      }
    });
  }

  // Carrega todos os comandos
  loadCommands(slashCommandsPath);

  if (commands.length === 0) {
    console.warn('⚠️  Nenhum slash command encontrado.');
    return;
  }

  console.log(`\n📂 Carregando ${commands.length} slash command(s)...\n`);

  // Registra os comandos no servidor específico
  client.on('ready', async () => {
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

    try {
      // ID do servidor onde registrar os comandos (mude se necessário)
      const guildId = '1499614916229988504';

      // Registra os comandos na guilda
      await rest.put(
        Routes.applicationGuildCommands(client.user.id, guildId),
        { body: commands }
      );

      console.log(`✅ Slash commands registrados com sucesso no servidor ${guildId}!`);
    } catch (error) {
      console.error('❌ Erro ao registrar slash commands:', error.message);
    }
  });
};
