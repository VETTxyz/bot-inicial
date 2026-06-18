/**
 * utils/codeRunner.js
 * Chama a API de execução do JDoodle e formata o resultado em embed.
 *
 * Cadastro grátis (200 chamadas/dia): https://www.jdoodle.com/compiler-api
 * Depois de criar a conta, pegue o clientId e o clientSecret e configure:
 *   JDOODLE_CLIENT_ID=...
 *   JDOODLE_CLIENT_SECRET=...
 *
 * ⚠️ Limitação importante: a API do JDoodle (no plano padrão) NÃO inclui
 * Go, Rust, Ruby, Kotlin nem Bash — só o que está em LANGUAGE_MAP abaixo.
 * Se algum dia mudar de API de novo, só este arquivo precisa ser trocado.
 */

const { EmbedBuilder } = require('discord.js');

const JDOODLE_CLIENT_ID = process.env.JDOODLE_CLIENT_ID || null;
const JDOODLE_CLIENT_SECRET = process.env.JDOODLE_CLIENT_SECRET || null;

// languageCode + versionIndex exigidos pela API do JDoodle.
// versionIndex "0" é a versão base de cada linguagem; se quiser uma versão
// mais nova, confira o índice certo em:
// https://docs.jdoodle.com/compiler-api/compiler-api#what-languages-and-versions-supported
const LANGUAGE_MAP = {
  python: { code: 'python3', versionIndex: '0' },
  python3: { code: 'python3', versionIndex: '0' },
  py: { code: 'python3', versionIndex: '0' },
  python2: { code: 'python2', versionIndex: '0' },
  java: { code: 'java', versionIndex: '0' },
  javascript: { code: 'nodejs', versionIndex: '0' },
  js: { code: 'nodejs', versionIndex: '0' },
  node: { code: 'nodejs', versionIndex: '0' },
  nodejs: { code: 'nodejs', versionIndex: '0' },
  typescript: { code: 'typescript', versionIndex: '0' },
  ts: { code: 'typescript', versionIndex: '0' },
  c: { code: 'c', versionIndex: '0' },
  cpp: { code: 'cpp17', versionIndex: '0' },
  'c++': { code: 'cpp17', versionIndex: '0' },
  csharp: { code: 'csharp', versionIndex: '0' },
  cs: { code: 'csharp', versionIndex: '0' },
  'c#': { code: 'csharp', versionIndex: '0' },
  php: { code: 'php', versionIndex: '0' },
  perl: { code: 'perl', versionIndex: '0' },
  pascal: { code: 'pascal', versionIndex: '0' },
  scala: { code: 'scala', versionIndex: '0' },
  swift: { code: 'swift', versionIndex: '0' },
  groovy: { code: 'groovy', versionIndex: '0' },
  lua: { code: 'lua', versionIndex: '0' },
  cobol: { code: 'cobol', versionIndex: '0' },
  sql: { code: 'sql', versionIndex: '0' },
};

function normalizeLanguage(input) {
  return input.trim().toLowerCase();
}

// Executa o código e devolve o resultado bruto (sem formatação de Discord)
async function runCode(languageInput, code) {
  if (!JDOODLE_CLIENT_ID || !JDOODLE_CLIENT_SECRET) {
    throw new Error(
      'Faltam JDOODLE_CLIENT_ID e JDOODLE_CLIENT_SECRET nas variáveis de ambiente do bot (cadastro grátis em jdoodle.com/compiler-api).'
    );
  }

  const language = normalizeLanguage(languageInput);
  const lang = LANGUAGE_MAP[language];
  if (!lang) {
    throw new Error(
      `Linguagem "${languageInput}" não é suportada pela API do JDoodle. Use uma destas: ${Object.keys(LANGUAGE_MAP).join(', ')}.`
    );
  }

  const res = await fetch('https://api.jdoodle.com/v1/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId: JDOODLE_CLIENT_ID,
      clientSecret: JDOODLE_CLIENT_SECRET,
      script: code,
      stdin: '',
      language: lang.code,
      versionIndex: lang.versionIndex,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`JDoodle respondeu ${res.status}: ${body || res.statusText}`);
  }

  const data = await res.json();

  if (data.error) {
    throw new Error(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));
  }

  return {
    language,
    output: data.output || '',
    isExecutionSuccess: Boolean(data.isExecutionSuccess),
    statusCode: data.statusCode,
    memory: data.memory,
    cpuTime: data.cpuTime,
  };
}

function truncate(text, max = 1000) {
  if (!text) return text;
  return text.length <= max ? text : `${text.slice(0, max)}\n... (cortado)`;
}

function codeBlock(text) {
  return '```\n' + truncate(text).replace(/```/g, '`\u200b``') + '\n```';
}

// Monta o embed clássico (sem Components V2) com o resultado da execução.
// O JDoodle devolve tudo (stdout + erro de runtime/compilação) num único
// campo "output", então não dá pra separar em stdout/stderr como no Piston.
function buildResultEmbed({ language, output, isExecutionSuccess, statusCode, memory, cpuTime }) {
  const success = isExecutionSuccess && statusCode === 200;

  const embed = new EmbedBuilder()
    .setColor(success ? 0x57f287 : 0xed4245)
    .setTitle(`▶️ Resultado — ${language}`)
    .addFields({
      name: success ? '📤 Saída' : '⚠️ Saída / erro',
      value: codeBlock(output || '(sem saída)'),
    })
    .setFooter({ text: `memória: ${memory ?? '?'} KB • cpu: ${cpuTime ?? '?'}s` })
    .setTimestamp();

  return embed;
}

// Monta o embed de erro quando a chamada à API falha (ex: sem chave, língua inválida)
function buildErrorEmbed(error) {
  return new EmbedBuilder()
    .setColor(0xed4245)
    .setTitle('❌ Não consegui executar')
    .setDescription(codeBlock(error.message || String(error)));
}

module.exports = { runCode, buildResultEmbed, buildErrorEmbed, normalizeLanguage };