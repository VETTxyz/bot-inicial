module.exports = {
  name: 'ping',
  description: 'Verifica a latência do bot',
  aliases: ['p', 'latência'],
  usage: 'ping',
  category: 'utility',
  cooldown: 3,
  async execute(message, args, client) {
    try {
      const reply = await message.reply({
        content: '🏓 Calculando latência...',
      });
      const latency = reply.createdTimestamp - message.createdTimestamp;
      const apiLatency = Math.round(client.ws.ping);
      const pingMessage = `
🏓 **Pong!**
• **Latência da mensagem:** \`${latency}ms\`
• **Latência da API:** \`${apiLatency}ms\`
• **Status:** ${apiLatency < 100 ? '✅ Excelente' : apiLatency < 200 ? '🟡 Bom' : '🔴 Ruim'}
      `.trim();

      await reply.edit({
        content: pingMessage,
      });

    } catch (error) {
      console.error('Erro no comando ping:', error);
      message.reply('❌ Ocorreu um erro ao executar o comando.');
    }
  }
};
