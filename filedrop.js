/*!
  FileDrop JavaScript classes | by Proger_XP | In public domain
  http://proger.i-forge.net/FileDrop/7CC
*/

window.fd = window.fd || {
  logging: true,
  onObjCall: null,
  all: [],    // all DropHandle/FileDrop objects that were instantinated.
  // IE 6 on XP SP 3 gives JScript version 5.7 while IE 8 - 5.8.
  isIE6: /*@cc_on/*@if(@_jscript_version<=5.7)true@else@*/false/*@end@*/,
  isChrome: (navigator.vendor || '').indexOf('Google') != -1,
  isFirebug: !!(window.console && window.console.dir)
}

fd.RandomID = function () { return 'fd_' + (Math.random() * 10000).toFixed(); }
fd.ByID = function (id) { return fd.IsTag(id) ? id : document.getElementById(id); }

fd.IsTag = function (element, tag) {
  return typeof element == 'object' && element && element.nodeType == 1 &&
         ( !tag || element.tagName.toUpperCase() == tag.toUpperCase() );
}

fd.NewXHR = function () {
  try {
    return new XMLHttpRequest;
  } catch (e) {
    var activex = new Array("MSXML2.XMLHTTP.6.0",
                             "MSXML2.XMLHTTP.5.0",
                             "MSXML2.XMLHTTP.4.0",
                             "MSXML2.XMLHTTP.3.0",
                             "MSXML2.XMLHTTP",
                             "Microsoft.XMLHTTP");

    for (var i = 0; i < activex.length && !request; i++) {
      try {
        return new ActiveXObject(activex[i]);
      } catch (e) {}
    }
  }
}

fd.IsArray = function (aVar) {
  return Object.prototype.toString.call(aVar) === '[object Array]';
}

fd.ToArray = function (aVar, skipFirst) {
  return Array.prototype.slice.call(aVar, skipFirst || 0);
}

fd.AddEvent = function (obj, type, fn) {
  if (obj.attachEvent) {
    obj['e' + type + fn] = fn;
    obj[type + fn] = function() { obj['e' + type + fn](window.event); }
    obj.attachEvent('on' + type, obj[type + fn]);
  } else {
    obj.addEventListener(type, fn, false);
  }
}

fd.StopEvent = function (event) {
  event.cancelBubble = true;
  event.returnValue = false;

  if (event.stopPropagation) { event.stopPropagation(); }
  if (event.preventDefault) { event.preventDefault(); }
}

fd.SetClass = function (element, className, append) {
  element = fd.ByID(element);

  if (fd.IsTag(element)) {
    if (typeof append == 'undefined' || append) {
      if (!fd.HasClass(element, className)) { element.className += ' ' + className; }
    } else {
      element.className = element.className.replace(fd.ClassRegExp(className), ' ');
    }
  }
}

fd.HasClass = function (element, className) {
  return fd.ClassRegExp(className).test( (fd.ByID(element) || {}).className );
}

fd.ClassRegExp = function (className) {
  if (className == null || className == '') {
    return /$o_O/;  // never matches.
  } else {
    return new RegExp('(^|\\s+)' + className + '(\\s+|$)', 'gi');
  }
}

fd.Extend = function (child, base, overwrite) {
  for (var prop in base) {
    if (overwrite || typeof child[prop] == 'undefined') { child[prop] = base[prop]; }
  }
}

fd.CallAll = function (list, args, obj) {
  args = [].concat(args);
  var res;

  if (fd.IsArray(list)) {
    for (var i = 0; i < list.length; i++) {
      if (typeof list[i] == 'function') {
        res = list[i].apply(obj || this, args);
        if (res != null) { break; }
      }
    }
  } else if (typeof list != 'undefined' && list != null && fd.isFirebug) {
    console.error('FileDrop event list must be either an Array or undefined/null,' +
                  ' ' + (typeof list) + ' was given.');
  }

  return res;
}

fd.CallOf = function (obj, event, args) {
  if (fd.logging && fd.isFirebug) {
    var handlers = obj.on[event] ? obj.on[event].length : 0;
    console.info('FileDrop ' + event + ' event (' + handlers + '); args:');
    console.dir([args]);
  }

  var preview = [fd.onObjCall].concat(obj.on.event);
  var res = fd.CallAll(preview, [event].concat(args), obj);
  if (res != null) { return res; }

  return fd.CallAll(obj.on[event], args, obj);
}

fd.DropHandle = function (zone, opt) {
  var self = this;

  self.zone = zone = fd.ByID(zone);
  if (!zone) { throw 'Cannot locate DOM node given to new FileDrop().'; }

  self.opt = {zoneClass: 'fd-zone', inputClass: 'fd-file',
              iframe: {url: ''}, input: null, fullDocDragDetect: false};

  fd.all.push(this);

  fd.Extend(self.opt, opt, true);
  if (fd.isChrome) { self.opt.fullDocDragDetect = true; }

  self.on = {event: [], dragEnter: [], dragLeave: [], dragOver: [], dragEnd: [],
             dragExit: [], upload: [], uploadElsewhere: [], inputSetup: [],
             iframeSetup: [], iframeDone: []};

  self.Hook = function (node) {
    if (self.opt.input != false) {
      self.opt.input = self.opt.input || self.PrepareInput(node);
      if (self.opt.input) { fd.CallOf(self, 'inputSetup', self.opt.input); }
    }

    self.HookDragOn(node);
    self.HookDropOn(node);
  }

    self.HookDragOn = function (node) {
      function DoHook(event, toBody) {
        fd.AddEvent(toBody ? document.body : node, event.toLowerCase(), function (e) {
          fd.StopEvent(e);
          fd.CallOf(self, event, e);
        });
      }

      if (self.opt.fullDocDragDetect) {
        DoHook('dragEnter', true);

        fd.AddEvent(document, 'dragleave', function (e) {
          if ((e.clientX == 0 && e.clientY == 0) || fd.IsTag(e.relatedTarget, 'html')) {
            fd.StopEvent(e);
            fd.CallOf(self, 'dragLeave', e);
          }
        });
      } else {
        DoHook('dragEnter');
        DoHook('dragLeave');
      }

      // causes Chrome to display the "No Drop" cursor on the drop target
      if (!fd.isChrome) { DoHook('dragOver'); }

      DoHook('dragEnd');    // doesn't work anywhere
      DoHook('dragExit');   // works in FF
    }

    self.HookDropOn = function (node) {
      function OnUpload(e) {
        fd.StopEvent(e);
        fd.CallOf(self, 'upload', e);
      }

      if (!fd.isIE6) {
        // albeit IE 6 "supports" drag & drop (while IE 8 doesn't) it will
        // send an empty POST body so as of today this only works for Firefox.
        fd.AddEvent(node, 'drop', OnUpload);
      }

      if (self.opt.input) {
        fd.AddEvent(self.opt.input.file, 'change', OnUpload);
      }
    }

  self.PrepareInput = function (node) {
    var res = {file: self.FindInputRec(node) || self.CreateInputAt(node)};

    if (res.file) {
      var form = res.file.parentNode;
      while (form && !fd.IsTag(form, 'form')) { form = res.form.parentNode; }

      var target = form ? form.getAttribute('target') : '';
      if (target && fd.IsTag(fd.ByID(target), 'iframe')) { res.form = form; }
    }

    return res;
  }

    self.FindInputRec = function (parent) {
      var resule;

      for (var i = 0; !resule && i < parent.childNodes.length; i++) {
        var node = parent.childNodes[i];
        if (fd.IsTag(node, 'input') && node.getAttribute('type') == 'file' &&
            fd.HasClass(node, self.opt.inputClass)) {
          resule = node;
        } else if (node.childNodes.length > 0) {
          resule = self.FindInputRec(node);
        }
      }

      return resule;
    }

    self.CreateInputAt = function (parent) {
      do { var id = fd.RandomID(); } while (fd.ByID(id));

      var cont = document.createElement('div');
      // iframe code and several other things around are courtesy of QQ File Uploader
      // (https://github.com/valums/file-uploader).
      cont.innerHTML = '<iframe src="javascript:false;" name="' + id + '"></iframe>' +
                       '<form method="post" enctype="multipart/form-data">' +
                         '<input type="hidden" name="fd-callback" />' +
                         '<input type="file" name="fd-file" />' +
                       '</form>';

      cont.firstChild.setAttribute('id', id);
      cont.firstChild.style.display = 'none';

      cont.lastChild.setAttribute('target', id);

      var nextChild = parent.firstChild;
      // Opera doesn't recognize legend and put it on top of the fieldset unless
      // it's the first child.
      while (nextChild && (!fd.IsTag(nextChild) || fd.IsTag(nextChild, 'legend'))) {
        nextChild = nextChild.nextSibling;
      }

        if (nextChild) {
          // Firefox 10 requires that immediate parent has position: relative for
          // overflow: hidden to work on the input; this in turn requires that that
          // parent is the first child, otherwise top: 0 of the file input won't work.
          parent.insertBefore(cont, nextChild);
        } else {
          parent.appendChild(cont);
        }

      return cont.lastChild.lastChild;
    }

  self.AbortIFrame = function () {
    if (self.opt.input.form) {
      var iframe = fd.ByID(self.opt.input.form.getAttribute('target'));
      if (iframe) { iframe.setAttribute('src', 'javascript:false;'); }
    }
  }

  self.SendViaIFrame = function (url) {
    url = url || self.opt.iframe.url;
    var form = (self.opt.input || {}).form;
    
    if (url && form) {
      // IE will trigger <input>'s onchange on drop even though it won't populate it.
      if (!('__proto__' in {}) && (!self.opt.input.file.value || 
          self.opt.input.file.value.length < 3)) { 
        return;
      }

      do { var cb = fd.RandomID(); } while (window[cb]);

      window[cb] = function (resp) {
        var obj = typeof resp == 'object' ? resp : {response: resp, responseText: resp,
                                                    readyState: 4, status: 200};
        fd.Extend(obj, {iframe: true, url: url});
        fd.CallOf(self, 'iframeDone', obj);
      };

      var cbInput = form.firstChild;
      while (cbInput && (!fd.IsTag(cbInput, 'input') || cbInput.name != 'fd-callback')) {
        cbInput = cbInput.nextSibling;
      }

      if (cbInput) {
        cbInput.value = cb;
      } else {
        url = url.replace(/[?&]$/, '') +
              (url.indexOf('?') == -1 ? '?' : '&') + 'fd-callback=' + cb;
      }

      form.setAttribute('action', url);

      fd.CallOf(self, 'iframeSetup', form);
      form.submit();
    }
  }

  self.Multiple = function (enable) {
    if (!self.opt.input) {
      throw 'FileDrop.Multiple(): no self.opt.input assigned.';
    }

    if (typeof enable != 'undefined') {
      enable ? self.opt.input.file.setAttribute('multiple', 'multiple')
             : self.opt.input.file.removeAttribute('multiple');
    }

    return !!self.opt.input.file.getAttribute('multiple');
  }

  self.SetupInput = function (input) {
    input.file.className = self.opt.inputClass;

    var parent = input.file.parentNode;
    if (parent && parent.style.display.match(/^(static)?$/)) {
      parent.style.position = 'relative';
    }

    if (fd.IsTag(zone, 'fieldset')) {
      // Firefox 13 or so has started to ignore overflow: hidden on fieldsets.
      var div = document.createElement('div');
      div.style.position = 'relative';
      div.style.overflow = 'hidden';
      zone.parentNode.insertBefore(div, zone);
      div.appendChild(zone);
    }
  }

  self.on.inputSetup.push(self.SetupInput);

  self.on.upload.push(function () {
    for (var i = 0; i < fd.all.length; i++) {
      if (fd.all[i] !== self && fd.all[i].on) {
        fd.CallOf(fd.all[i], 'uploadElsewhere', self);
      }
    }
  });

  fd.SetClass(zone, self.opt.zoneClass);
  self.Hook(zone);
}

fd.FileDrop = function (zone, opt) {
  var self = this;

  zone = fd.ByID(zone);
  self.handle = new fd.DropHandle(zone, opt);

  self.opt = self.handle.opt;
  fd.Extend(self.opt, {dragOverClass: 'over'});
  fd.Extend(self.opt.iframe, {force: false});
  fd.Extend(self.opt, opt, true);

  self.on = self.handle.on;
  fd.Extend(self.on, {send: [], fileSetup: []});

  self.SetClassesTo = function (node, isHovered) {
    fd.SetClass(node, self.opt.dragOverClass, isHovered);
  }

  self.OnUpload = function (e) {
    var files = !self.opt.iframe.force && self.GetFilesFrom(e);
    if (files == false) {
      self.handle.SendViaIFrame();  // no FileAPI/Chrome file features - use <iframe>.
    } else if (files.length > 0) {
      fd.CallOf(self, 'send', [files]);
    }
  }

    self.GetFilesFrom = function (e) {
      var list = e.dataTransfer ? e.dataTransfer : (e.target ? e.target.files : false);

      if (list == false) { return false; }
      if (list.files) { list = list.files; }    // Firefox 3.6

      var result = [];
      var names = {};

      for (var i = 0; i < list.length; i++) {
        var file = new fd.File(list[i]);

        if (names[file.name]) { continue; }   // Safari Windows adds first file several times.
        names[file.name] = true;

        fd.CallOf(self, 'fileSetup', file);
        if (file.size > 0) { result.push(file); }
      }

      return result;
    }

  self.on.upload.push(self.OnUpload);

  self.on.dragEnter       .push(function () { self.SetClassesTo(zone, true); });
  self.on.dragLeave       .push(function () { self.SetClassesTo(zone, false); });
  self.on.upload       .unshift(function () { self.SetClassesTo(zone, false); });
  self.on.uploadElsewhere .push(function () { self.SetClassesTo(zone, false); });

  fd.Extend(self, self.handle);
}
window.FileDrop = fd.FileDrop;

fd.File = function (file) {
  var self = this;

  self.nativeFile = file;
  self.name = file.fileName || file.name;
  self.size = file.fileSize || file.size;
  self.xhr = null;

  self.opt = {extraHeaders: true};
  self.on = {event: [], sendXHR: [], progress: [], done: [], error: []};

  self.SendTo = function (url) {
    if (window.FileReader) {
      var reader = new FileReader;

      reader.onload = function (e) { self.DoSendTo(url, e); }
      reader.onerror = function (e) { fd.CallOf(self, 'error', [e]); }

      reader.readAsBinaryString(self.nativeFile);
    } else {
      self.DoSendTo(url);
    }
  }

    self.DoSendTo = function (url, e) {
      self.Abort();

      self.xhr = fd.NewXHR();
      self.HookXHR(self.xhr);

      self.xhr.open('POST', url, true);
      self.xhr.overrideMimeType('application/octet-stream');
      self.xhr.setRequestHeader('Content-Type', 'application/octet-stream');

      if (self.opt.extraHeaders) {
        self.xhr.setRequestHeader('X-File-Name', encodeURIComponent(self.name));
        self.xhr.setRequestHeader('X-File-Size', self.size);

        var api = window.FileReader ? 'FileAPI' : 'Webkit';
        self.xhr.setRequestHeader('X-Requested-With', 'FileDrop-XHR-' + api);
      }

      var data = (e && e.target && e.target.result) ? e.target.result : self.nativeFile;
      fd.CallOf(self, 'sendXHR', [self.xhr, data]);
    }

      self.HookXHR = function (xhr) {
        var evtHost = xhr.upload || xhr;

        xhr.onreadystatechange = function (e) {
          if (xhr.readyState == 4) {
            try {
              var event = xhr.status == 200 ? 'done' : 'error';
            } catch (e) {
              var event = 'error';
            }

            var args = event == 'error' ? [e, xhr] : [xhr, e];
            fd.CallOf(self, event, args);
          }
        }

        evtHost.onprogress = function (e) {
          var current = e.lengthComputable ? e.loaded : null;
          fd.CallOf(self, 'progress', [current, e.total, xhr, e]);
        }
      }

  self.Abort = function () {
    if (self.xhr && self.xhr.abort) { self.xhr.abort(); }
  }

  // data is either a binary string (Gecko/Chrome) or a native file
  // object (Safari).
  self.SendXHR = function (xhr, data) {
    if (xhr.sendAsBinary) {
      xhr.sendAsBinary(data);
    } else if (typeof data == 'string') {
      // sendAsBinary() replacement for Chrome and others:
      // http://javascript0.org/wiki/Portable_sendAsBinary
      try {
        var ords = Array.prototype.map.call(data, function (x) {
          return x.charCodeAt(0) & 0XFF;
        });

        var ui8a = new Uint8Array(ords);
        xhr.send(ui8a.buffer);
      } catch (e) {
        xhr.send(data);
      }
    } else {
      xhr.send(data);
    }
  }

  self.on.sendXHR.push(self.SendXHR);
}

fd.jQuery = function ($) {
  $ = $ || jQuery || window.$;
  if (!$) { throw 'No jQuery/$ object to integrate FileDrop into.'; }

  $.fn.filedrop = function (options) {
    function Delegate(prefix, firstArgs) {
      return function (event) {
        var args = (firstArgs || []).concat(fd.ToArray(arguments, 1));
        return $node.triggerHandler(prefix + event, args);
      };
    }

    var $node = this;
    var host = this.data('filedrop');

    if (typeof options == 'string') {
      if (!host) {
        $.error("$.filedrop('comment') needs an initialized FilrDrop on this element.");
      } else if (typeof host[options] === 'undefined') {
        $.error("There's no method or property FileDrop." + options + ".");
      } else {
        var value = host[options];
        if (typeof value == 'function') {
          return value.apply(host, fd.ToArray(arguments, 1));
        } else {
          return value;
        }
      }
    } else if (!options || typeof options == 'object') {
      if (!host) {
        var zone = new FileDrop(this[0], options);
        this.data('filedrop', zone);

        zone.on.event.push(Delegate('fd'));

        zone.on.fileSetup.push(function (file) {
          file.on.event.push(Delegate('file', [file]));
        });
      } else if (!options) {
        return host;
      } else {
        fd.Extend(host.opt, options, true);
      }
    } else {
      $.error('Invalid $.filedrop() parameter - expected nothing (creates new zone),' +
              ' a string (property to access) or an object (custom zone options).');
    }

    return $node;
  }
}

// If removed and a parenthesis follows (e.g. after concatenation with other scripts)
// the last defined function here will be executed: fd.func = ... + (function () {})
;