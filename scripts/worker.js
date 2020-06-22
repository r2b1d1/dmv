import * as DLT from './dlt.js';

var pages;
var data;
var sdata;

function buildPages(total, pageSize) {
  const pagesCount = ~~(total / pageSize);
  let page;
  let start;
  let end;
  const pages = [];
  for (page = 0; page <= pagesCount; page++) {
    start = page * pageSize;
    end = start + pageSize < total ? start + pageSize : total;
    pages.push({ start: start, end: end });
    if (end === total - 1) {
      break;
    }
  }
  return { current: 0, total: pagesCount, pages: pages };
}

function getNextPage() {
  const current = pages.current;
  const total = pages.total;
  if (current > total) {
    return null;
  }
  const start = pages.pages[current].start;
  const end = pages.pages[current].end;
  pages.current++;
  return data.slice(start, end);
}

function search(find) {
  var arr = data;
  find.map(f => {
    arr = arr.filter((e, i) => {
      if (Object.values(e)[0][f[0]].toLowerCase().includes(f[1])) {
        return e;
      }
    });
  });
  return arr;
}

function handleFile(file, callback) {
  const reader = new FileReader();
  let type;

  reader.addEventListener('load', (event) => {
    let d = event.target.result;
    if (type === 'json') {
      d = JSON.parse(d);
    } else {
      try {
        d = DLT.parseBuffer(d);
      } catch (error) {
        console.error(error);
        throw new Error('Unsupported file format!');
      }
    }
    callback(d);
  });

  if (file.type === 'application/json') {
    type = 'json';
    reader.readAsText(file);
  } else {
    if (file.size > 30000000) {
      throw new Error('File too large, convert it to json before loading it');
    }
    type = 'bin';
    reader.readAsArrayBuffer(file);
  }
}

self.onmessage = event => {
  const cmd = event.data.cmd;
  const content = event.data.content;
  var page;

  switch (cmd) {
    case 'new':
      handleFile(event.data.file, d => {
        sdata = d;
        postMessage({ cmd: cmd });
      });
      break;
    case 'update':
      data = sdata;
      pages = buildPages(data.length, 50);
      postMessage({ cmd: cmd, content: data.length });
      break;
    case 'next':
      page = getNextPage();
      if (page) {
        postMessage({ cmd: cmd, content: page });
      }
      break;
    case 'search':
      data = sdata;
      data = search(content);
      pages = buildPages(data.length, 50);
      postMessage({
        cmd: 'update',
        content: data.length
      });
      break;
  }
};
