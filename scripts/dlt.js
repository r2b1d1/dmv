/* global BigInt */

const tyle = 0x0000000f;
const tyle8bit = 0x00000001;
const tyle16bit = 0x00000002;
const tyle32bit = 0x00000003;
const tyle64bit = 0x00000004;
const tyle128bit = 0x00000005;

function stringify(arr) {
  return String.fromCharCode.apply(String, arr.map(b => parseInt(b, 16)));
}

function getMsgType(type) {
  return ['log', 'app trace', 'network trace', 'control'][type];
}

function getLogLevel(lvl) {
  return ['off', 'fatal', 'error', 'warning', 'info', 'debug', 'verbose'][lvl];
}

function getControlType(type) {
  return ['', 'request', 'response', 'time'][type];
}

function getAppTraceType(type) {
  return ['', 'variable', 'func_in', 'func_out', 'state', 'vfb'][type];
}

function getNetworkTraceType(type) {
  return ['', 'ipc', 'can', 'flexray', 'most', 'vfb'][type];
}

function getArgType(type) {
  const bool = 0x00000010;
  const sint = 0x00000020;
  const uint = 0x00000040;
  const floa = 0x00000080;
  const aray = 0x00000100;
  const strg = 0x00000200;
  const rawd = 0x00000400;
  const vari = 0x00000800;
  const fixp = 0x00001000;
  const trai = 0x00002000;
  const stru = 0x00004000;
  const scod = 0x00038000;

  if (type & bool) {
    return 'bool';
  } else if (type & sint) {
    return 'int';
  } else if (type & uint) {
    return 'uint';
  } else if (type & floa) {
    return 'float';
  } else if (type & aray) {
    return 'array';
  } else if (type & strg) {
    return 'string';
  } else if (type & rawd) {
    return 'raw';
  } else if (type & vari) {
    return 'var';
  } else if (type & fixp) {
    return 'offset';
  } else if (type & trai) {
    return 'trace';
  } else if (type & stru) {
    return 'struct';
  } else if (type & scod) {
    return 'encoding';
  } else {
    return 'unknown';
  }
}

function getBool(msg) {
  return parseInt(msg.splice(0, 1).join(''), 16);
}

function getInt(msg, type) {
  let value;
  switch (type & tyle) {
    case tyle8bit:
      value = parseInt(msg.splice(0, 1).join(''), 16);
      break;
    case tyle16bit:
      value = parseInt(msg.splice(0, 2).reverse().join(''), 16);
      break;
    case tyle32bit:
      value = parseInt(msg.splice(0, 4).reverse().join(''), 16);
      break;
    case tyle64bit:
      value = parseInt(msg.splice(0, 8).reverse().join(''), 16);
      break;
    case tyle128bit:
      value = msg.splice(0, 16);
      break;
  }
  return value;
}

function parseFloat(number, format) {
  var s;
  var e;
  var f;
  var m = 0;
  var i = 1;
  var j = 1;
  switch (format) {
    case 32:
      s = (number >> 31) ? -1 : 1;
      e = ((number >> 23) & 0xff) - 0x7f;
      f = ((number & 0x7fffff) + 0x800000).toString(2);
      while (i < f.length) {
        m += parseInt(f[i]) ? Math.pow(2, -j) : 0;
        i++;
        j++;
      }
      break;
    case 64:
      s = (BigInt(number) >> BigInt('63')) ? -1 : 1;
      e = (number >> 52) & 0xfff - 0x3ff;
      f = ((BigInt(number) & BigInt('0xfffffffffffff')) +
        BigInt('0x10000000000000')).toString(2);
      i = 1;
      j = 1;
      while (i < f.toString(2).length) {
        m += parseInt(f[i]) ? Math.pow(2, -j) : 0;
        i++;
        j++;
      }
      break;
    default:
      return NaN;
  }
  return s * Math.pow(2, e) * (1 + m);
}

function getFloat(msg, type) {
  let value;
  switch (type & tyle) {
    case tyle8bit:
      value = msg.splice(0, 1);
      break;
    case tyle16bit:
      value = msg.splice(0, 2);
      break;
    case tyle32bit:
      value = parseFloat(parseInt(msg.splice(0, 4).reverse().join(''), 16), 32);
      break;
    case tyle64bit:
      value = parseFloat(parseInt(msg.splice(0, 8).reverse().join(''), 16), 64);
      break;
    case tyle128bit:
      value = msg.splice(0, 16);
      break;
  }
  return value;
}

function getString(msg) {
  const len = parseInt(msg.splice(0, 2).reverse().join(''), 16);
  return stringify(msg.splice(0, len)).slice(0, -1);
}

function getRaw(msg) {
  const len = parseInt(msg.splice(0, 2).reverse().join(''), 16);
  return msg.splice(0, len).join(' ');
}

function parsePayload(msg) {
  const content = [];
  while (msg.length) {
    const type = parseInt(msg.splice(0, 4).reverse().join(''), 16);
    switch (getArgType(type)) {
      case 'bool':
        content.push(getBool(msg));
        break;
      case 'int':
        content.push(getInt(msg, type));
        break;
      case 'uint':
        content.push(getInt(msg, type));
        break;
      case 'float':
        content.push(getFloat(msg, type));
        break;
      case 'string':
        content.push(getString(msg));
        break;
      case 'raw':
        content.push(getRaw(msg));
        break;
      default:
        console.warn(msg);
        console.warn(getArgType(type));
        console.warn('*******');
        msg.splice(0, msg.length);
        break;
    }
  }
  return content.join(' ');
}

function parseHeader(msg) {
  'use strict';
  msg = msg.match(/.{1,2}/g);
  const header = {};
  header.seconds = parseInt(msg.splice(0, 4).reverse().join(''), 16);
  header.microSeconds = parseInt(msg.splice(0, 4).reverse().join(''), 16);
  header.ecuId = stringify(msg.splice(0, 4));
  var htyp = parseInt(msg.splice(0, 1), 16);
  header.counter = parseInt(msg.splice(0, 1), 16);
  header.length = parseInt(msg.splice(0, 2).join(''), 16);
  if (htyp & 0x04) {
    header.ecuId = stringify(msg.splice(0, 4));
  }
  if (htyp & 0x08) {
    header.sessionId = msg.splice(0, 4);
  }
  if (htyp & 0x10) {
    header.timestamp = msg.splice(0, 4);
  }
  if (htyp & 0x01) {
    const info = parseInt(msg.splice(0, 1), 16);
    header.type = getMsgType((info & 0x0e) >> 1);
    switch (header.type) {
      case 'log':
        header.info = getLogLevel((info & 0xf0) >> 4);
        break;
      case 'control':
        header.info = getControlType((info & 0xf0) >> 4);
        break;
      case 'app trace':
        header.info = getAppTraceType((info & 0xf0) >> 4);
        break;
      case 'network trace':
        header.info = getNetworkTraceType((info & 0xf0) >> 4);
        break;
      default:
        header.info = 'undefined';
        break;
    }
    header.args = parseInt(msg.splice(0, 1), 16);
    header.appId = stringify(msg.splice(0, 4));
    header.ctxId = stringify(msg.splice(0, 4));
  } else {
    header.type = 'undefined';
    header.info = 'undefined';
    header.appId = 'undefined';
    header.ctxId = 'undefined';
  }

  return { header: header, payload: msg };
}

export function parseBuffer(buffer) {
  var d = new Uint8Array(buffer);

  if (d[0] !== 0x44 || d[1] !== 0x4c || d[2] !== 0x54 || d[3] !== 0x01) {
    throw new Error('Not a dlt file!');
  }

  d = Array.from(d)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .split('444c5401');
  d.shift();
  return d.map((msg, i) => {
    const data = parseHeader(msg);
    let payload;
    if (data.header.type === 'log') {
      payload = parsePayload(data.payload);
    } else {
      payload = data.payload.join(' ');
    }
    const index = i.toString().padStart(d.length.toString().length, 0);
    return {
      [index]: {
        seconds: data.header.seconds,
        microSeconds: data.header.microSeconds,
        ecu: data.header.ecuId,
        app: data.header.appId,
        ctx: data.header.ctxId,
        type: data.header.type,
        info: data.header.info,
        payload: payload
      }
    };
  });
}
