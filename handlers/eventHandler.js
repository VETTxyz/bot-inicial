const fs = require('fs');
const path = require('path');

module.exports = (client) => {
  const eventsPath = path.join(__dirname, '../events');
  
  if (!fs.existsSync(eventsPath)) {
    console.warn(`⚠️  Pasta de eventos não encontrada em: ${eventsPath}`);
    return;
  }

  // Lê todos os arquivos da pasta de eventos
  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

  if (eventFiles.length === 0) {
    console.warn('⚠️  Nenhum arquivo de evento encontrado na pasta /events');
    return;
  }

  console.log(`\n📂 Carregando ${eventFiles.length} evento(s)...\n`);

  // Carrega cada arquivo de evento
  eventFiles.forEach(file => {
    const filePath = path.join(eventsPath, file);
    
    try {
      // Recarrega o módulo (útil para desenvolvimento)
      delete require.cache[require.resolve(filePath)];
      
      const event = require(filePath);

      // Valida a estrutura do arquivo
      if (!event.name) {
        console.warn(`⚠️  ${file}: falta a propriedade 'name'`);
        return;
      }

      if (typeof event.execute !== 'function') {
        console.warn(`⚠️  ${file}: falta a função 'execute'`);
        return;
      }

      // Registra o evento
      if (event.once) {
        // Evento que ocorre apenas uma vez
        client.once(event.name, (...args) => {
          event.execute(client, ...args);
        });
        console.log(`✅ Evento [${event.name}] carregado (executa uma única vez)`);
      } else {
        // Evento que ocorre múltiplas vezes
        client.on(event.name, (...args) => {
          event.execute(client, ...args);
        });
        console.log(`✅ Evento [${event.name}] carregado`);
      }

    } catch (error) {
      console.error(`❌ Erro ao carregar o evento ${file}:`);
      console.error(error);
    }
  });

  console.log('');
};
