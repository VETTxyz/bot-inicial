const fs = require('fs');
const path = require('path');

module.exports = (client) => {
  client.commands = new Map();
  client.cooldowns = new Map();

  const commandsPath = path.join(__dirname, '../commands');

  if (!fs.existsSync(commandsPath)) {
    console.warn(`⚠️  Pasta de comandos não encontrada em: ${commandsPath}`);
    return;
  }

  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  if (commandFiles.length === 0) {
    console.warn('⚠️  Nenhum arquivo de comando encontrado na pasta /commands');
    return;
  }

  console.log(`\n📂 Carregando ${commandFiles.length} comando(s)...\n`);

  commandFiles.forEach(file => {
    const filePath = path.join(commandsPath, file);

    try {
      delete require.cache[require.resolve(filePath)];

      const command = require(filePath);
      if (!command.name) {
        console.warn(`⚠️  ${file}: falta a propriedade 'name'`);
        return;
      }

      if (typeof command.execute !== 'function') {
        console.warn(`⚠️  ${file}: falta a função 'execute'`);
        return;
      }

      // Armazena o comando
      client.commands.set(command.name, command);

      // Armazena os apelidos (aliases)
      if (command.aliases && Array.isArray(command.aliases)) {
        command.aliases.forEach(alias => {
          client.commands.set(alias, command);
        });
      }

      // Log do comando carregado
      const aliasInfo = command.aliases ? ` | Aliases: ${command.aliases.join(', ')}` : '';
      console.log(`✅ Comando [${command.name}]${aliasInfo}`);

    } catch (error) {
      console.error(`❌ Erro ao carregar o comando ${file}:`);
      console.error(error);
    }
  });

  console.log('');
};
