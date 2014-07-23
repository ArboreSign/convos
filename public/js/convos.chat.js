;(function($) {
  window.convos = window.convos || {};
  window.link_embedder_text_gist_github_styled = 1; // custom gist styling

  convos.at_bottom = true; // start ui scrolled to bottom
  convos.at_bottom_threshold = !!('ontouchstart' in window) ? 110 : 40;
  convos.current = {};
  convos.draw = {};
  convos.isChannel = function(str) { return str.match(/^[#&]/); };

  convos.draw['add-connection'] = function() {
    var channels = {};
    var s;

    $('select#name option').each(function() {
      channels[this.value] = ($(this).attr('data-channels') || '').split(' ');
    });
    $('select#name').selectize({
      create: false,
      openOnFocus: true,
      onChange: function(val) {
        s.clearOptions();
        s.addOption($.map(channels[val], function(i) { return { value: i, text: i,  }; }));
        s.refreshOptions(false);
        s.setValue(channels[val].join(' '));
      }
    }).trigger('change');
    $('input#channels').selectize({
      delimiter: ' ',
      persist: false,
      openOnFocus: true,
      create: function(value) {
        if (convos.isChannel(value)) value = '#' + value;
        return { value: value, text: value };
      }
    });

    s = $('input#channels')[0].selectize;
  };

  convos.draw['ui'] = function() {
    var menu_width = 0;
    $('nav .right').add('nav ul.conversations a').each(function() { menu_width += $(this).outerWidth(); });
    $('nav a.conversations')[ menu_width > $('body').outerWidth() ? 'addClass' : 'removeClass' ]('overlapping');
    if (convos.at_bottom) $(window).scrollTo('bottom');
  };

  $.fn.addToMessages = function(func) { // func = {prepend,append}
    return this.attachEventsToMessage().each(function() {
      var $message = $(this);
      var $messages = $('div.messages ul');
      var $previous = $messages.children('li').not('.message-pending').eq(-1);
      var last_nick = $previous.data('sender') || '';
      var action;

      if ($message.hasClass('message') && $previous.hasClass('message') && last_nick == $message.data('sender')) {
        $message.addClass('same-nick');
      }
      if (action = $message.attr('class').match(/^nick-(\w+)/)) { // nick-change, -joined, -parted, -quit, -init
        convos.nicks[action[1]]($message);
      }

      if (!$message.hasClass('nick-init')) {
        $messages[func || 'append']($message.fadeIn('fast'));
      }
    });
  };

  $.fn.attachEventsToMessage = function() {
    // internal app links
    this.find('a').not('.external').click(function(e) {
      e.preventDefault();
      if ($(this).hasClass('autocomplete')) {
        var str = $(this).text();
        convos.input.val(convos.input.val() ? convos.input.val().replace(/\s+$/, '') + ' ' + str + ' ' : str + ': ').focus();
      }
      else {
        $.pjax.click(e, { container: 'div.messages', fragment: 'div.messages' });
      }
    });

    // embed media
    this.find('a.external').each(function() {
      var $a = $(this);
      $.get($.url_for('/oembed'), { url: this.href }, function(embed_code) {
        var $embed_code = $(embed_code);
        $a.closest('div').after($embed_code);
        if (convos.at_bottom) {
          $(window).scrollTo('bottom');
          $embed_code.find('img').one('load', function() { $(window).scrollTo('bottom') });
        }
      });
    });

    // actions
    this.find('.close').click(function() { $(this).closest('li').remove(); });
    this.filter('.historic-message').find('a.button.newer').click(getNewerMessages);

    return this;
  };

  $.noCache = function(args) {
    args._ts = new Date().getTime();
    return args;
  };

  $.fn.scrollTo = function(pos) {
    if(pos === 'bottom') { $(this).scrollTop($('body').height()); }
    else { $(this).scrollTop(pos); }
    return this;
  };

  var focusFirst = function() {
    if (document.activeElement && $(document.activeElement).is(':input')) return;
    if (convos.input.length) return convos.input.focus();
    $('form input[type="text"]:visible').eq(0).focus();
  };

  var getHistoricMessages = function() {
    if (!convos.current.start_time) return;
    $.get(location.href.replace(/\?.*/, ''), { to: convos.current.start_time }, function(data) {
      var $ul = $(data).find('ul[data-network]');
      var $li = $ul.children('li:lt(-1)');
      var height_before_prepend = $('body').height();
      if (!$li.length) return;
      convos.current.start_time = parseFloat($ul.data('start-time'));
      $($li.get().reverse()).addToMessages('prepend');
      $(window).scrollTop($('body').height() - height_before_prepend);
    });
    convos.current.start_time = 0;
  };

  var getNewerMessages = function(e) {
    e.preventDefault();
    if (!convos.current.end_time) return;
    var $btn = $(this);
    $.get(location.href.replace(/\?.*/, ''), { from: convos.current.end_time }, function(data) {
      var $ul = $(data);
      var $li = $ul.children('li:gt(0)');
      $btn.closest('li').remove();
      if (!$li.length) return;
      convos.current.end_time = parseFloat($ul.data('end-time'));
      $li.addToMessages();
    });
    convos.current.end_time = 0;
    $('body').addClass('loading');
  };

  var initPjax = function() {
    $(document).on('pjax:timeout', function(e) { e.preventDefault(); });
    $(document).pjax('nav ul a', 'div.messages', { fragment: 'div.messages' });
    $(document).pjax('.sidebar-right a', 'div.messages', { fragment: 'div.messages' });

    $('div.messages').on('pjax:beforeReplace', function(xhr, options) { $('body').removeClass('loading'); });
    $('div.messages').on('pjax:beforeSend', function(xhr, options) { return !$(this).hasClass('no-pjax'); });
    $('div.messages').on('pjax:start', function(xhr, options) { $('body').addClass('loading'); });

    $('div.messages').on('pjax:success', function(e, data, status_text, xhr, options) {
      var $doc = data.match(/<\w/) ? $(data) : $('body');
      var $messages = $('div.messages ul'); // injected to the document using pjax
      var draw = $doc.find('[data-draw]').attr('data-draw');

      convos.nicks.reset();
      convos.current.end_time = parseFloat($messages.attr('data-end-time'));
      convos.current.start_time = parseFloat($messages.attr('data-start-time'));
      convos.current.nick = $messages.attr('data-nick') || '';
      convos.current.state = $messages.attr('data-state') || 'disconnected';
      convos.current.network = $messages.attr('data-network') || 'convos';
      convos.current.target = $messages.attr('data-target') || '';

      $messages.find('li').attachEventsToMessage();
      $doc.filter('form.sidebar').each(function() { $('form.sidebar ul').html($(this).find('ul:first').children()); });
      $doc.filter('nav').each(function() { $('nav ul.conversations').html($(this).find('ul.conversations').children()); });

      if (convos.isChannel(convos.current.target)) {
        convos.send('/names');
      }
      else {
        convos.socket.send('PING');
      }

      if (location.href.indexOf('from=') > 0) getHistoricMessages();
      if (!navigator.is_ios) focusFirst();
      if (draw) convos.draw[draw](e);
      if (data) $('body').hideSidebar();

      convos.at_bottom = true; // make convos.draw.ui scroll to bottom
      convos.draw.ui(e);
      convos.send(''); // open socket
    });
  };

  $(document).ready(function() {
    $.ajaxSetup({ error: function(jqXHR, exception) { console.log('ajax: ' + this.url + ' failed: ' + exception); } });
    $.post($.url_for('/profile/timezone/offset'), { hour: new Date().getHours() });

    initPjax();

    $('body, input').bind('keydown', 'alt+shift+a shift+return', function() { $('nav a.conversations').trigger('tap'); return false; });
    $('body, input').bind('keydown', 'alt+shift+s', function() { $('nav a.notifications').trigger('tap'); return false; });
    $('body, input').bind('keydown', 'alt+shift+d', function() { $('nav a.sidebar').filter(':visible').trigger('tap'); return false; });

    if (navigator.is_ios) {
      $('input, textarea')
        .on('click', function() { $('body').addClass('ios-input-focus'); })
        .on('focusout', function() { $('body').removeClass('ios-input-focus'); });
    }

    $(window).on('resize', convos.draw.ui);

    $(window).on('scroll', function(e) {
      convos.at_bottom = $(this).scrollTop() + $(this).height() > $('body').height() - convos.at_bottom_threshold;
      if ($(window).scrollTop() == 0) getHistoricMessages();
    });

    // handle cmd://... url
    $(document).click(function(e) {
      var cmd = (e.target.href || '').match(/^cmd:\/\/(.*)/);
      if (!cmd) return;
      e.preventDefault();
      convos.send(cmd[1]);
      $('body').hideSidebar();
    });

    // clear notifications when showing notifications sidebar
    $('.notification-list').on('show', function(e) {
      var $n = $('nav a.notifications b');
      if ($n.text().length) $.post($.url_for('/chat/notifications/clear'));
      $n.text('');
    }).find('a').on('click', function(e) { $(this).parent('.unread').removeClass('unread'); })
  });

  $(window).load(function() {
    $('div.messages').trigger('pjax:success', [ '', 'success', {}, {} ]); // render initial div.messages
    if (!navigator.is_ios) focusFirst(); // need to focus even if we have no div.messages
  });
})(jQuery);
