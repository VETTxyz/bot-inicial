const config = require('../config');

const COLOR_ALIASES = {
  success: config.colors.success,
  error: config.colors.error,
  warning: config.colors.warning,
  info: config.colors.info,
  default: config.colors.info,
};

function normalizeBoolean(value) {
  return /^(true|yes|1|on)$/i.test(String(value));
}

function normalizeColor(value) {
  if (!value) return null;

  const normalized = String(value).trim();
  const lower = normalized.toLowerCase();

  if (COLOR_ALIASES[lower]) {
    return COLOR_ALIASES[lower];
  }

  if (/^#?[0-9a-f]{6}$/i.test(normalized)) {
    return normalized.startsWith('#') ? normalized : `#${normalized}`;
  }

  return normalized;
}

function normalizeString(value) {
  return String(value)
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .trim();
}

function parseEmbedArgs(rawInput) {
  const options = {
    message: null,
    title: null,
    description: null,
    url: null,
    color: null,
    author: null,
    author_icon: null,
    author_url: null,
    footer: null,
    footer_icon: null,
    thumbnail: null,
    image: null,
    timestamp: false,
    fields: [],
  };

  const errors = [];
  let index = 0;

  const skipWhitespace = () => {
    while (index < rawInput.length && /\s/.test(rawInput[index])) {
      index += 1;
    }
  };

  const parseKey = () => {
    const match = rawInput.slice(index).match(/^([a-zA-Z0-9_.]+)/);
    if (!match) return null;
    index += match[1].length;
    return match[1].toLowerCase();
  };

  const parseQuotedValue = (quoteChar) => {
    index += 1; // pula a aspa de abertura
    let value = '';
    while (index < rawInput.length) {
      const char = rawInput[index];
      if (char === quoteChar) {
        index += 1;
        return value;
      }
      if (char === '\\' && index + 1 < rawInput.length) {
        const nextChar = rawInput[index + 1];
        if (nextChar === quoteChar || nextChar === '\\') {
          value += nextChar;
          index += 2;
          continue;
        }
      }
      value += char;
      index += 1;
    }
    errors.push(`Valor entre aspas não fechado para a chave ${quoteChar}`);
    return value;
  };

  const parseValue = () => {
    skipWhitespace();

    if (index >= rawInput.length) return '';
    const currentChar = rawInput[index];
    if (currentChar === '"' || currentChar === "'") {
      return normalizeString(parseQuotedValue(currentChar));
    }

    const match = rawInput.slice(index).match(/^([^\s"']+)/);
    if (!match) return '';
    index += match[1].length;
    return normalizeString(match[1]);
  };

  while (index < rawInput.length) {
    skipWhitespace();
    if (index >= rawInput.length) break;

    const rawKey = parseKey();
    if (!rawKey) {
      errors.push(`Chave inválida ou inesperada em: ${rawInput.slice(index, index + 10).trim()}`);
      index += 1;
      continue;
    }

    skipWhitespace();
    if (rawInput[index] !== ':') {
      errors.push(`Falta ':' após a chave ${rawKey}`);
      continue;
    }
    index += 1;

    const rawValue = parseValue();
    const value = normalizeString(rawValue);
    const key = rawKey.toLowerCase();

    switch (key) {
      case 'message':
      case 'content':
        options.message = value;
        break;
      case 'title':
        options.title = value;
        break;
      case 'description':
      case 'desc':
        options.description = value;
        break;
      case 'url':
      case 'link':
        options.url = value;
        break;
      case 'color':
      case 'cor':
        options.color = normalizeColor(value);
        break;
      case 'author':
      case 'author.name':
        options.author = value;
        break;
      case 'author_icon':
      case 'author.icon':
        options.author_icon = value;
        break;
      case 'author_url':
      case 'author.url':
        options.author_url = value;
        break;
      case 'footer':
      case 'footer.text':
        options.footer = value;
        break;
      case 'footer_icon':
      case 'footer.icon':
        options.footer_icon = value;
        break;
      case 'thumbnail':
      case 'thumbnail.url':
        options.thumbnail = value;
        break;
      case 'image':
      case 'image.url':
        options.image = value;
        break;
      case 'timestamp': {
        if (value === '' || normalizeBoolean(value)) {
          options.timestamp = true;
        } else {
          const parsed = new Date(value);
          if (!Number.isNaN(parsed.valueOf())) {
            options.timestamp = parsed;
          } else {
            errors.push(`Timestamp inválido: ${rawValue}`);
          }
        }
        break;
      }
      case 'field':
      case 'field.name': {
        options.fields.push({ name: value, value: null, inline: false });
        break;
      }
      case 'value':
      case 'field.value':
      case 'field_value': {
        if (!options.fields.length) {
          options.fields.push({ name: 'Campo sem nome', value, inline: false });
        } else {
          const current = options.fields[options.fields.length - 1];
          current.value = value;
        }
        break;
      }
      case 'inline':
      case 'field.inline':
      case 'field_inline': {
        if (!options.fields.length) {
          options.fields.push({ name: 'Campo sem nome', value: null, inline: false });
        }
        const current = options.fields[options.fields.length - 1];
        current.inline = normalizeBoolean(value);
        break;
      }
      default:
        errors.push(`Chave desconhecida: ${rawKey}`);
        break;
    }
  }

  options.fields = options.fields
    .filter(field => field && field.name && field.value)
    .slice(0, 25);

  return { options, errors };
}

module.exports = {
  parseEmbedArgs,
};
