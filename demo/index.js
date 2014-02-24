/*!
  FileDrop Revamped - demo page
  in public domain  | http://filedropjs.org
  by Proger_XP      | http://proger.me
*/

(function (fd) {
  if (!fd) {
    return alert('Problem loading FileDrop script. Check your console for messages.')
  }

  var yesImage = 'data:image/gif;base64,R0lGODlhEAAOAKIAAEa+FXvcR+Pm4qzmk3ecbPLy8gAAAAAAACH5BAAAAAAALAAAAAAQAA4AAANDWLqsRC26MaBcZKjqLB4CBUBEEHglNQAjAVBnkYqjzJonHrCWywK6n0fgu+FqDKIR5kmWAqpmgwjlXBRUguC6IG4lCQA7'

  var $
  var curSample = ':'
  var allFiles = new fd.FileList

  function cleanCode(str) {
    str = $.trim(str)
    var minIndent = NaN

    $.each(str.match(/^ +/gm) || [], function (i, indent) {
      if (isNaN(minIndent) || minIndent > indent.length) {
        minIndent = indent.length
      }
    })

    if (!isNaN(minIndent)) {
      str = str.replace(new RegExp('^ {' + minIndent + '}', 'gm'), '')
    }

    return str
  }

  function nav(cur) {
    curSample = cur
    cur = cur || $('nav li a').attr('href')
    log('')

    $(cur).show()
      .siblings('article').hide()

    $('nav li').removeClass('cur')
      .find('a[href="' + cur + '"]').parent().addClass('cur')

    var cont = $(cur)
    if (!cont.length) { return }

    cont.children('h3').append($('#btns'))
    var js = cont.children('script').first()
    var html = cont.children().first()
    while (html.is('h3,p')) { html = html.next() }
    html = html.nextAll(':not(script)').andSelf()

    if (js[0] == cont.children().last()[0]) {
      // Sample page not yet initialized.
      cont.append('<h4>JavaScript</h4>')
      $('<pre>').text( cleanCode(js.html()) ).appendTo(cont)

      cont.append('<h4>HTML</h4>')
      var rawHTML = $('<div>').append(html.clone()).html()
      $('<pre>').text( cleanCode(rawHTML) ).appendTo(cont)

      try {
        ;(function () { eval(js.html()) })()
      } catch (e) {
        alert('Problem running this sample:\n' + e)
      }
    }
  }

  function log(line) {
    var log = fd.byID('log')
    log.value && (line += '\n')
    if (log.value.substr(0, line.length) != line) {
      log.value = line + log.value
    }
    return line
  }

  fd.addEvent(window, 'load', function () {
    if (!('jQuery' in window)) {
      return
    }

    $ = jQuery

    setInterval(function () {
      var cur = location.hash
      curSample == cur || nav(cur)
    }, 100)

    $(document).on('click', 'article h4', function () {
      $(this).toggleClass('collapsed')
    })
  })

  fd.onObjectCall = function (e, arg1, arg2) {
    $('#events th').filter(function () { return $.trim(this.textContent) == e })
      .next().empty().append( $('<img>').attr('src', yesImage) )

    var handlers = this.events[e] ? this.events[e].length : 0
    var s = handlers == 1 ? '' : 's'
    log('  ' + e + ' event (' + handlers + ' handler' + s + ')')

    if (e == 'iframeSetup') {
      log('\nSending data via <'+'iframe>...\n')
    } else if (e == 'iframeDone') {
      fd.byID('response').value = 'IFrame upload response: ' + arg1.responseText;
    } else if (e == 'xhrSend') {
      var info = [Math.round(this.size / 1024) + ' KiB', this.type,
                  'changed on ' + this.modDate.toLocaleString()]
      log('\n' + this.name + ' (' + info.join(', ') + ')...\n')
    } else if (e == 'xhrSetup') {
      $('#berror.down').length && arg1.open('POST', 'non-existing.php', true)
    } else if (e == 'fileSetup') {
      allFiles.push(arg1)
    } else if (e == 'progress') {
      log(arg1 + ' of ' + arg2 + ' bytes uploaded')
    } else if (e == 'error') {
      if (arg2) {
        fd.byID('response').value = '-- XMLHttpRequest error -- status = ' + arg2.status
      } else {
        log(arg1)
      }
    } else if (e == 'done') {
      fd.byID('response').value = arg1.responseText
    }
  }

  fd.byID('badd').onclick = function () {
    var cont = $(this).parents('article')
    var zone = cont.find('.fd-zone').first()
    var parent = zone.parent().is('article') ? zone : zone.parentsUntil('article')
    var id = fd.uniqueID()

    var regexp = new RegExp(zone.attr('id'), 'g')
    var code = $('<div>').append(zone.clone()).html().replace(regexp, id)
    $(code).css({marginTop: '1em'}).insertAfter(parent)

    var js = cont.children('script').first()
    var code = js.html().replace(regexp, id)
    ;(function () { eval(code) })()
  }

  fd.byID('berror').onclick = function () {
    $(this).toggleClass('down')
  }

  fd.byID('babort').onclick = function () {
    $.each(fd.all, function (i, obj) {
      obj.abortIFrame && obj.abortIFrame()
    })

    allFiles.abort()
  }

  ;(fd.byID('report') || {}).onclick = function () {
    var ua = navigator.userAgent
    var msg = prompt('Have any comment? The following user-agent string will be sent along:\n' + ua, '-');

    if (typeof msg == 'string') {
      var script = document.createElement('script')
      script.type = 'text/javascript'
      script.src = this.href.replace(/\/+$/, '') +
                   '/report.php?jsonp=1&msg=' + encodeURIComponent('[BROKEN] ' + msg)
      var first = document.getElementsByTagName('script')[0]
      first.parentNode.insertBefore(script, first)
    }

    return false
  }
})(window.fd)