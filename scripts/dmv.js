var worker;

if (window.Worker) {
  worker = new Worker('scripts/worker.js', { type: 'module' });
  worker.onmessage = event => {
    const cmd = event.data.cmd;
    const content = event.data.content;

    switch (cmd) {
      case 'new':
        $('.table').trigger({
          type: 'table.update',
          msg: { cmd: 'new' }
        });
        break;
      case 'update':
        $('.table').trigger({
          type: 'table.update',
          msg: { cmd: 'current', data: content }
        });
        break;
      case 'next':
        $('.table').trigger({
          type: 'table.update',
          msg: { cmd: 'content', data: content }
        });
        break;
      case 'search':
        $('.table').trigger({
          type: 'table.update',
          msg: { cmd: 'search', data: content }
        });
        break;
    }
  };
  worker.onerror = event => {
    console.error(event.filename + ':' + event.lineno + ':' + event.colno +
      ':', event.type + ':', event.message);
    const msg = event.message.replace('Uncaught Error: ', '');
    $('.container-fluid').append(
      `<div class="alert alert-dismissible alert-light">
        <button type="button" class="close" data-dismiss="alert">&times;
        </button>
        ${msg}
      </div>`
    );
    $('.landing').removeClass('d-none').addClass('d-flex');
    $('.file').addClass('d-none');
    $('.help').addClass('d-none').removeClass('d-flex');
    $('.progress-spinner').addClass('d-none');
  };
} else {
  console.error('The browser doesn\'t support web workers');
}

$('.file-selector').on('change', event => {
  const file = event.target.files[0];

  if (file) {
    $('.landing').removeClass('d-flex').addClass('d-none');
    $('.help').addClass('d-none').removeClass('d-flex');
    $('.file').addClass('d-none');
    $('.table').addClass('d-none');
    $('.table tbody').empty();
    $('.progress-spinner').removeClass('d-none');
    worker.postMessage({ cmd: 'new', file: file });
  }
});

$('.table').on('table.update', event => {
  switch (event.msg.cmd) {
    case 'new':
      worker.postMessage({ cmd: 'update' });
      break;
    case 'current':
      worker.postMessage({ cmd: 'next' });
      $('.progress-spinner').addClass('d-none');
      if ($('.table, .file').hasClass('d-none')) {
        $('.table, .file').removeClass('d-none');
      }
      $('.table tbody').empty();
      $('.spinner img').addClass('d-none');
      $('.spinner p').text(event.msg.data);
      break;
    case 'content':
      $('.table').trigger({ type: 'table.render', content: event.msg.data });
      break;
    case 'search':
      $('.table tbody').empty();
      $('.spinner img').addClass('d-none');
      $('.spinner p').text(event.msg.data.length);
      $('.table').trigger({ type: 'table.render', content: event.msg.data });
      break;
    default:
      break;
  }
});

$('.table').on('table.render', event => {
  event.content.map(msg => {
    const index = parseInt(Object.keys(msg)[0]);
    const content = Object.values(msg)[0];
    const time = content.seconds + '.' + content.microSeconds;
    var color;

    switch (content.info) {
      case 'fatal':
      case 'error':
        color = 'text-danger';
        break;
      case 'warning':
        color = 'text-warning';
        break;
      case 'info':
        color = 'text-info';
        break;
    }

    $('.table tbody').append(
      `<tr class="${color}">
        <th scope="row" class="text-center align-middle">${index}</th>
        <td class="text-center align-middle">${time}</td>
        <td class="text-center align-middle ecu">${content.ecu}</td>
        <td class="text-center align-middle app">${content.app}</td>
        <td class="text-center align-middle ctx">${content.ctx}</td>
        <td class="text-center align-middle type">${content.type}</td>
        <td class="text-center align-middle info">${content.info}</td>
        <td class="text-break payload">${content.payload}</td>
      </tr>`
    );
  });
});

(function ($) {
  'use strict';
  $.fn.translate = function (x, hide = false) {
    var origin = parseInt($(this).css('top'));
    const height = $(this)[0].clientHeight;
    if (hide) {
      x < origin ? x = x + height : x = x - height;
    }
    var id = setInterval(() => {
      const offset = parseInt($(this).css('top'));
      let i = offset;
      if (x < origin) {
        x <= i ? i -= 10 : i = x;
      } else {
        x >= i ? i += 10 : i = x;
      }
      if (i === x) {
        if (hide) {
          $(this).css({ display: 'none' });
        }
        clearInterval(id);
      }
      $(this).css({ top: i });
    }, 10);
    return this;
  };
}(jQuery));

$(function () {
  $('.actions').draggable({ containment: 'window' });
  $('.search-box').draggable({ containment: 'window' });

  $('.actions').on('click', event => {
    const target = event.currentTarget;
    const th = target.clientHeight;
    const ttop = target.offsetTop;
    const tleft = target.offsetLeft;
    const wh = $(window).height();
    const offset = $(target).data('offset');

    if ($(target).hasClass('blink')) {
      $(target).removeClass('blink');
    }

    if ($(target).hasClass('active')) {
      $('.action').each((i, e) => {
        $(e).translate(ttop, true);
      });
      $('.add-button').removeClass('d-none');
      $('.x-button').addClass('d-none');
      $(target).removeClass('active clicked');
    } else {
      $('.action').each((i, e) => {
        i++;
        const posUp = ttop + (th + offset) * i;
        const posDown = ttop - (th + offset) * i;
        $(e).css({
          top: ttop,
          left: tleft,
          display: 'flex'
        });
        $(e).translate(ttop < wh / 2 ? posUp : posDown);
      });
      $('.add-button').addClass('d-none');
      $('.x-button').removeClass('d-none');
      $(target).addClass('active clicked');
    }
  });

  $('.action').on('click', e => {
    const trigger = $(e.currentTarget).data('trigger');
    $('.actions').trigger('click');
    switch (trigger) {
      case 'home':
        $('.landing').removeClass('d-none').addClass('d-flex');
        $('.file').addClass('d-none');
        $('.help').addClass('d-none').removeClass('d-flex');
        break;
      case 'table':
        if ($('#table-body tr').length > 0) {
          $('.landing').addClass('d-none').removeClass('d-flex');
          $('.file').removeClass('d-none');
          $('.help').addClass('d-none').removeClass('d-flex');
        }
        break;
      case 'open':
        $('.file-selector').trigger('click');
        break;
      case 'search':
        if (!$('.file').hasClass('d-none')) {
          $('.search-box').removeClass('d-none').addClass('d-flex');
          $('.spinner img').addClass('d-none');
        }
        break;
      case 'help':
        $('.help').addClass('d-flex').removeClass('d-none');
        $('.landing').addClass('d-none').removeClass('d-flex');
        $('.file').addClass('d-none');
        break;
    }
  });

  $('.open-file').on('click', () => {
    $('.file-selector').trigger('click');
  });

  $('.search-box-close').on('click', () => {
    $('.search-box').removeClass('d-flex').addClass('d-none');
  });

  $('.search-text').on('input', e => {
    var value = $(e.currentTarget).val().toLowerCase();
    var find = [];

    $('.clear-button, .spinner img').removeClass('d-none');
    $('.spinner p').text('');

    $('.table').children('tbody').children('tr').each((i, e) => {
      $(e).show();
    });

    if (value.match(/^\//)) {
      value = value.substring(1);
      if (value.match(/.*\//)) {
        if (value.split('/')[0].match(/&/g)) {
          const v = value.split('/')[0];
          v.split('&').map(e => {
            find.push(e.split('='));
          });
        } else if (value.split('/')[0].match(/.*=/)) {
          const v = value.split('/')[0];
          find.push(v.split('='));
        }

        value = value.split('/')[1].trim();
        find.push(['payload', value]);
      } else {
        return false;
      }
    } else {
      find = [['payload', value]];
    }

    worker.postMessage({ cmd: 'search', content: find });
  });

  $('.clear-button').on('click', e => {
    $('.search-text').val('');
    $(e.currentTarget).addClass('d-none');
    $('.spinner img').removeClass('d-none');
    $('.spinner p').text('');
    worker.postMessage({ cmd: 'search', content: [['payload', '']] });
  });

  $('.search-box').on('click', e => {
    if ($(e.currentTarget).hasClass('blink')) {
      $(e.currentTarget).removeClass('blink');
    }
  });

  $(window).on('scroll', () => {
    const st = Math.floor($(window).scrollTop()) + 1;
    const dh = $(document).height();
    const wh = $(window).height();
    if (st >= dh - wh) {
      worker.postMessage({ cmd: 'next' });
    }
  });

  $(document).on('keydown', event => {
    if (event.key === 'f' && event.ctrlKey) {
      if (!$('.file').hasClass('d-none')) {
        event.preventDefault();
        $('.search-box').removeClass('d-none').addClass('d-flex');
        $('.spinner img').addClass('d-none');
      }
    }
  });
});
