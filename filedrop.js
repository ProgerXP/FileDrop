/*!
  FileDrop Revamped - HTML5 & legacy file upload
  in public domain  | http://filedropjs.org
  by Proger_XP      | http://proger.me

  Supports IE 6+, FF 3.6+, Chrome 7+, Safari 5+, Opera 11+.
  Fork & report problems at https://github.com/ProgerXP/FileDrop
*/

;(function (root, init) {
  if (typeof define == 'function' && define.amd) {
    define(['exports'], function (exports) { init(root, exports) })
  } else if (typeof exports !== 'undefined') {
    init(root, exports)
  } else {
    init(root, root.fd = root.fd || {})
  }
})(this, function (root, global) {
  /***
    Global Utility Functions
   ***/

  // Produces random ID (non necessary unique to anything) with given prefix
  // or 'fd' if it's not passed.
  //
  //? randomID()        //=> 'fd_9854'
  //? randomID('foo')   //=> 'foo_1582'
  global.randomID = function (prefix) {
    return (prefix || 'fd') + '_' + (Math.random() * 10000).toFixed()
  }

  // Generates random DOM node ID that's unique to this document with given prefix
  // or 'fd' if it's not passed.
  //
  //? randomID()        //=> 'fd_9854'
  //? randomID('foo')   //=> 'foo_1582'
  global.uniqueID = function (prefix) {
    do { var id = global.randomID(prefix) } while (global.byID(id))
    return id
  }

  // Retrieves DOM element by its ID attribute or returns id itself if it's
  // an element.
  //
  //? byID('foo')       //=> <p id="foo">
  //? byID('abracadabra!')  //=> null
  //? byID({foo: 1})    //=> null
  //? byID(null)        //=> null
  //
  //? byID(document.createElement('p'))
  //    //=> <p>
  global.byID = function (id) {
    return global.isTag(id) ? id : document.getElementById(id)
  }

  // Checks if given object is a proper DOM node. If tag is passed also
  // checks if that DOM node is of the same tag (case-insensitive).
  // Returns true or false.
  //
  //? isTag('foo')        //=> false
  //? isTag({foo: 1})     //=> false
  //? isTag(null)         //=> false
  //? isTag(window)       //=> false
  //? isTag(document.body)          //=> true
  //? isTag(document.body, 'BoDy')  //=> true
  //? isTag(document.body, 'head')  //=> false
  //
  //? var el = byID('foo')    //=> <p id="foo">
  //  isTag(el, 'p')    //=> true
  //  isTag(el, 'P')    //=> true
  //  isTag(el, 'div')  //=> false
  //  isTag(el, 'DiV')  //=> false
  //
  //? isTag(document.createElement('p'))
  //    //=> true
  //
  //? isTag(document.createElement('p'), 'div')
  //    //=> false
  global.isTag = function (element, tag) {
    return typeof element == 'object' && element && element.nodeType == 1 &&
           ( !tag || element.tagName.toUpperCase() == tag.toUpperCase() )
  }

  // Creates new XMLHttpRequest object. Falls back for ActiveX for IE 6.
  // Throws an exception if couldn't succeed (this shouldn't happen these days).
  //
  //? newXHR()    //=> XMLHttpRequest
  global.newXHR = function () {
    try {
      return new XMLHttpRequest
    } catch (e) {
      // IE 6.
      var activex = ['MSXML2.XMLHTTP.6.0', 'MSXML2.XMLHTTP.5.0',
                     'MSXML2.XMLHTTP.4.0', 'MSXML2.XMLHTTP.3.0',
                     'MSXML2.XMLHTTP', 'Microsoft.XMLHTTP']

      for (var i = 0; i < activex.length; i++) {
        try {
          return new ActiveXObject(activex[i])
        } catch (e) {}
      }
    }

    throw 'Cannot create XMLHttpRequest.'
  }

  // Checks if given value is a native Array object. Note that jQuery and
  // other pseudo-arrays are reported as false.
  //
  //? isArray([])       //=> true
  //? isArray([])       //=> true
  //? isArray(new Array)    //=> true
  //? isArray({})       //=> false
  //? isArray('foo')    //=> false
  //? isArray(null)     //=> false
  //? isArray($('a'))   //=> false
  //? isArray(arguments)    //=> false
  //? isArray($('a').toArray())   //=> true
  global.isArray = function (value) {
    return Object.prototype.toString.call(value) === '[object Array]'
  }

  // Converts passed value into an array. If value is already an array its
  // copy is returned (so changing value later doesn't affect the returned
  // clone).
  //
  // skipFirst, if given, omits specified number of elements from the start.
  // Useful for turning arguments into arrays.
  //
  //? toArray([])           //=> [] (copy)
  //? toArray(['foo'])      //=> ['foo'] (copy)
  //? toArray(['foo'], 1)   //=> []
  //? toArray(['foo'], 999)   //=> []
  //? toArray('foo')        //=> ['foo']
  //? toArray('foo', 1)     //=> []
  //? toArray('foo', 999)   //=> []
  //? toArray({foo: 1})     //=> [{foo: 1}]
  //? toArray({foo: 1}, 1)  //=> []
  //? toArray(null)         //=> []
  //? toArray(new Array('foo', 'bar'))      => ['foo', 'bar'] (copy)
  //? toArray(new Array('foo', 'bar'), 1)   => ['bar']
  //? toArray(new Array('foo', 'bar'), 2)   => []
  //
  //? function showMessage(func, line1, line2, ...) {
  //    window[func](toArray(arguments, 1).join('\n'))
  //  }
  //
  //  showMessage('confirm', 'It\'s first line.', 'Second line.')
  //    //=> confirm('It\'s first line.\nSecond line.')
  //
  //  showMessage('alert', 'First', 'Second')
  //    //=> alert('First\nSecond')
  global.toArray = function (value, skipFirst) {
    if (value === null || typeof value == 'undefined') {
      return []
    } else if (!global.isArray(value) && (typeof value != 'object' || !('callee' in value))) {
      // Made sure it's not 'arguments'.
      value = [value]
    }

    return Array.prototype.slice.call(value, skipFirst || 0)
  }

  // Adds an event listener to a DOM element. Works for old IE as well
  // as modern W3C-compliant browsers. type is short event name (without
  // 'on' prefix). Does nothing if any parameter is invalid.
  // Returns the DOM element itself or whatever was given as this argument.
  //
  //? addEvent(byID('p'), 'mousemove', function () { alert('Whoosh!') })
  //? addEvent(window, 'load', function () { alert('Done loading.') })
  //
  //? addEvent(null, 'blur', function () { })   // nothing.
  //? addEvent(window, null, function () { })   // nothing.
  //? addEvent(window, 'blur', null)            // nothing.
  //
  //? addEvent(window, 'nonstandard', function () { })
  //      // works.
  global.addEvent = function (element, type, callback) {
    if (element && type && callback) {
      if (element.attachEvent) {
        element['e' + type + callback] = callback
        element[type + callback] = function() {
          element['e' + type + callback](window.event)
        }
        element.attachEvent('on' + type, element[type + callback])
      } else {
        element.addEventListener(type, callback, false)
      }
    }

    return element
  }

  // Stops propagation and default browser action of an event.
  // Works for old IE and modern W3C-compliant browsers.
  //
  //? byID('p').onmousemove = function (e) { stopEvent(e) }
  global.stopEvent = function (event) {
    event.cancelBubble = true
    event.returnValue = false
    event.stopPropagation && event.stopPropagation()
    event.preventDefault && event.preventDefault()
    return event
  }

  // Adds or removes HTML class of a DOM element. Keeps old classes.
  // element can be either ID string or a DOM node.
  // Returns the element (even if ID was passed) or null if passed value
  // is neither a string nor a DOM node or if there's no element with
  // this ID.
  //
  //? setClass(byID('p'), 'foo')      //=> <p class="... foo">
  //? setClass(byID('p'), 'foo', true)  // equivalent to above
  //? setClass(byID('p'), 'foo', false)   //=> <p class="..."> (no 'foo')
  //? setClass('anID', 'foo')         //=> <a id="anID" class="... foo">
  //? setClass('anID', 'foo', false)  //=> <a> without 'foo' class
  //?
  global.setClass = function (element, className, append) {
    if ((element = global.byID(element)) && className != null) {
      if (typeof append != 'undefined' && !append) {
        element.className = element.className.replace(global.classRegExp(className), ' ')
      } else if (!global.hasClass(element, className)) {
        element.className += ' ' + className
      }
    }

    return element
  }

  // Determines if given element has class attribute containing the className
  // word. Accepts DOM element or ID string. Returns true or false.
  // Examples below refer to <p class="cls1 cls2" id="anID">
  //
  //? hasClass(byID('anID'), 'cls1')  //=> true
  //? hasClass('anID', 'cls1')        // equivalent to above
  //? hasClass('anID', 'cls')         //=> false
  //? hasClass('anID', 'foo')         //=> false
  //? hasClass('abra!', 'cls1')       //=> false (no such element)
  //? hasClass('anID', '')            //=> false (empty class)
  //? hasClass('anID', null)          //=> false
  //? hasClass('anID', {foo: 1})      //=> false (not a string)
  //? hasClass(null, 'foo')           //=> false
  //? hasClass({foo: 1}, 'foo')       //=> false (not a DOM node)
  //? hasClass(window, foo)           //=> false
  global.hasClass = function (element, className) {
    return global.classRegExp(className).test( (global.byID(element) || {}).className )
  }

  // Returns a regular expression suitable for testing of HTML class-like
  // strings to find out if it contains a given word or not (it's not as
  // simple as a substring match: 'some class' contains words 'some' and
  // 'class' but not 'som' and 'cl' or 'ame' and 'ass').
  //
  // Shouldn't be used for testing multiple words (space-separated) - will
  // only match if they are in the same position in testing string which
  // doesn't have to be true: classRegExp('some class') would match
  // 'this is some class' but won't match 'some of the class'.
  //
  // Returns a never matching regexp for bad parameter like object or an
  // empty string.
  //
  //? classRegExp('foo')        //=> RegExp /(^|\s+)foo(\s+|$)/ig
  //? classRegExp('x').test('x y z')  //=> true
  //? classRegExp('foo bar')    // works but not advised
  //? classRegExp({foo: 1})     //=> RegExp /$o_O/
  //? classRegExp(null)         // the same as above
  //? classRegExp(window)       // the same as above
  //? classRegExp(null).test('foo')  //=> false (always)
  global.classRegExp = function (className) {
    if (className == '' || typeof className == 'object') {
      return /$o_O/  // never matches.
    } else {
      return new RegExp('(^|\\s+)' + className + '(\\s+|$)', 'gi')
    }
  }

  // Copies properties from object base to object child. If overwrite
  // is passed and true then base's properties will replace those
  // in child even if child has its own properties of that name.
  // Note that it doesn't clone child, it's edited in-place.
  // Also note that defined properties that are 'undefined' on child are
  // replaced by base's even if overwrite is false (see examples).
  //
  // Returns the modified child (first argument).
  //
  //? extend({common: 1, child: false}, {common: 'foo', base: true})
  //    //=> {common: 1, child: false, base: true}
  //
  //? extend({common: 1, child: false}, {common: 'foo', base: true}, true)
  //    //=> {common: 'foo', child: false, base: true}
  //
  //? extend({x: undefined}, {x: 1})    //=> {x: 1}
  //? extend({x: null}, {x: 1})         //=> {x: null}
  //
  //? var child = {y: 1}
  //  extend(child, {x: 1}) === child   //=> true (same object)
  //  console.dir(child)    //=> {y: 1, x: 1}
  global.extend = function (child, base, overwrite) {
    child = child || {}
    base = base || {}

    for (var prop in base) {
      if (overwrite || typeof child[prop] == 'undefined') {
        child[prop] = base[prop]
      }
    }

    return child
  }

  /***
    Event Manipulation Functions
   ***/

  // Calls every handler of the passed callback list with given arguments
  // and in context of obj or 'this' if it's omitted.
  //
  // list can be undefined, a single function or an array (non-function members
  // are skipped). Throws exception if list is something else.
  // args is converted to array with toArray() so it can be a single value,
  // an arguments object or something else - see that function for info.
  //
  // Returns result of the last called function. If any function returns
  // a non-null and non-undefined value all following handlers are skipped.
  //
  //? callAll(function (a) { return a + 'foo' }, 'arg1')
  //    //=> 'arg1foo'
  //? callAll([ function () { } ], ['arg1'])
  //    // equivalent to above
  //
  //? var list = [function (a) { return a[0] == 'a' ? a + 'foo' : null },
  //              function (a) { alert(a) }]
  //  callAll(list, 'arg1')   //=> 'arg1foo' (first handler)
  //  callAll(list, 'foo')    //=> alert('foo') (second handler)
  //
  //? callAll(function () { alert(this.x) }, [], {x: 'foo'})
  //    //=> alert('foo')
  //
  //? callAll(function () { alert(this.x) }).call({x: 'foo'})
  //    // equivalent to above
  //
  //? window.onload = function () {
  //    callAll([...], arguments, window)
  //      // equivalent to callAll([...], toArray(arguments), window)
  //  }
  global.callAll = function (list, args, obj) {
    var res
    args = global.toArray(args)
    typeof list == 'function' && (list = [list])

    if (global.isArray(list)) {
      for (var i = 0; i < list.length; i++) {
        if (typeof list[i] == 'function') {
          res = list[i].apply(obj || this, args)
          if (res != null) { break }
        }
      }
    } else if (list) {
      throw 'FileDrop event list must be either an Array, Function, undefined or' +
            ' null but ' + (typeof list) + ' was given.'
    }

    return res
  }

  // Calls event handlers attached on given FileDrop object to passed
  // event name with arguments. Hands off most work to callAll().
  // obj is an object with the 'events' property (object with keys = event
  // names and values = arrays of functions).
  //
  // Before calling handlers of obj looks if global configuration has
  // a preview handler specified - if it does then calls that handler
  // and if it returns non-null and non-undefined value doesn't call
  // obj's handlers but returns that value immediately. After the global
  // preview function it checks for object-wise preview - its 'any' event
  // handlers which are treated likewise.
  // Preview functions are called with event name pushed in front of
  // the other event args.
  //
  //? var obj = {events: { foo: [function (a) { alert(a); return true }] }}
  //  callAllOfObject(obj, 'foo', 'arg1')   //=> true after alert('arg1')
  //
  //? window.fd.onObjectCall = function (e) { alert(e + ': tee hee'); return false }
  //  var obj = ...   // as above
  //  callAllOfObject(obj, 'foo', 'arg1')   //=> false after alert('foo: tee hee')
  //
  //? var obj = {events: { any: [function (e) { return false }] }}
  //  callAllOfObject(obj, 'anyevent')
  //    // because of the object-wise preview handler that returns false
  //    // any event we call will return false bypassing its actual handlers.
  global.callAllOfObject = function (obj, event, args) {
    if (global.logging && global.hasConsole) {
      var handlers = obj.events[event] ? obj.events[event].length || 0 : 0
      console.info('FileDrop ' + event + ' event (' + handlers + ') args:')
      console.dir([args])
    }

    var preview = [global.onObjectCall].concat(obj.events.any)
    var res = global.callAll(preview, [event].concat(global.toArray(args)), obj)
    return res != null ? res : global.callAll(obj.events[event], args, obj)
  }

  // Appends event listeners to given object with 'events' property according
  // to passed parameters. See DropHandle.event() for details.
  // 'this' must be set to the object which events are updated.
  global.appendEventsToObject = function (events, funcs) {
    if (global.addEventsToObject(this, false, arguments)) {
      return this
    }

    switch (arguments.length) {
    case 0:
      return global.extend({}, this.events)

    case 1:
      if (events === null) {
        this.events = {}
        return this
      } else if (global.isArray(events)) {
        var res = {}

        for (var i = 0; i < events.length; i++) {
          res[events[i]] = global.toArray(this.events[events[i]])
        }

        return res
      } else if (typeof events == 'function') {
        return global.funcNS(events)
      } else if (typeof events == 'string') {
        return global.toArray(this.events[events])
      }

    case 2:
      events = global.toArray(events)

      if (funcs === null) {
        for (var i = 0; i < events.length; i++) {
          var ns = global.splitNS(events[i])

          if (!ns[0]) {
            for (var event in this.events) {
              arguments.callee.call(this, [event + ':' + ns[1]], null)
            }
          } else if (!ns[1]) {
            this.events[ns[0]] = []
          } else if (this.events[ns[0]]) {
            for (var fi = this.events[ns[0]].length - 1; fi >= 0; fi--) {
              if (global.funcNS( this.events[ns[0]][fi] ) == ns[1]) {
                this.events[ns[0]].splice(fi, 1)
              }
            }
          }
        }

        return this
      }
    }

    throw 'Bad parameters for FileDrop event().'
  }

  // Prepends event listeners to given object with 'events' property according
  // to passed parameters. See DropHandle.event() for details.
  // 'this' must be set to the object which events are updated.
  global.previewToObject = function (events, funcs) {
    if (global.addEventsToObject(this, true, arguments)) {
      return this
    } else {
      throw 'Bad parameters for FileDrop preview().'
    }
  }

  // Adds event listeners to given object with 'events' property according
  // to passed parameters. See DropHandle.event() for details.
  // Returns nothing if couldn't handle given parameter combination.
  global.addEventsToObject = function (obj, prepend, args) {
    var events = args[0]
    var funcs = args[1]

    switch (args.length) {
    case 1:
      if (events && typeof events == 'object' && !global.isArray(events)) {
        for (var event in events) {
          arguments.callee(obj, prepend, [event, events[event]])
        }

        return true
      }

    case 2:
      if (typeof funcs == 'function' || global.isArray(funcs)) {
        events = global.toArray(events)
        funcs = global.toArray(funcs)
        var pusher = prepend ? 'unshift' : 'push'

        for (var i = 0; i < events.length; i++) {
          var ns = global.splitNS(events[i])
          for (var fi = 0; fi < funcs.length; fi++) {
            global.funcNS(funcs[fi], ns[1])
          }

          obj.events[ns[0]] = obj.events[ns[0]] || []
          obj.events[ns[0]][pusher].apply(obj.events[ns[0]], funcs)
        }

        return true
      }
    }
  }

  // Adds namespace identifier to a Function object. Used when labeling event
  // listeners in DropHandle.event(). If given just one parameter reads
  // attached namespace, if present.
  //
  //? funcNS(function () { }, 'foo')
  //? funcNS(function () { })   //=> 'foo'
  global.funcNS = function (func, ns) {
    if (typeof func != 'function') {
      return func
    } else if (arguments.length == 1) {
      return (func[global.nsProp] || '').toString()
    } else {
      func[global.nsProp] = (ns || '').toString()
      return func
    }
  }

  // Extracts namespace identifier from the string. Uses jQuery notation:
  // 'event:namespace'. Both parts can be empty. If colon is omitted returns
  // '' instead of namespace.
  // Returns array with two items - event name (or other prefix) and namespace.
  //
  //? splitNS('')       //=> ['', '']
  //? splitNS(null)     // identical to above
  //? splitNS(':')      // identical to above
  //? splitNS('x:')     //=> ['x', '']
  //? splitNS(':y')     //=> ['', 'y']
  //? splitNS('x:y')    //=> ['x', 'y']
  //? splitNS('x:y:z')  //=> ['x', 'y:z']
  global.splitNS = function (str) {
    return (str || '').match(/^([^:]*):?(.*)$/).slice(1)
  }

  /***
    Global Configuration
   ***/

  global.extend(global, {
    // If set all event calls will be logged to console if one is present.
    logging: true,

    // Indicates if console.log and console.dir are available for usage.
    hasConsole: 'console' in window && console.log && console.dir,

    // If set must be a function that's called on every event being fired.
    // See how it works in callAllOfObject().
    onObjectCall: null,

    // All DropHandle objects that were instantinated on this page.
    // Note that these are not FileDrop instances as not all DropHandles
    // might be part of FileDrops. Use DropHandle.filedrop property.
    all: [],

    // Tests for IE versions, must be true for 6-7/9 and below and
    // false for any other version/browser.
    // IE 6 on XP SP 3 gives JScript version 5.7 while IE 8 - 5.8.
    // IE 9 on Win7 gives 9.
    isIE6: /*@cc_on/*@if(@_jscript_version<=5.7)true@else@*/false/*@end@*/,
    isIE9: /*@cc_on/*@if(@_jscript_version<=9)true@else@*/false/*@end@*/,

    // Test for Google Chrome. This isn't used to determine available
    // File API but only to work around certain event glitches.
    isChrome: (navigator.vendor || '').indexOf('Google') != -1,

    // Name of Function object property where event namespace is stored.
    // See funcNS(), splitNS(), DropHandle.event().
    nsProp: '_fdns'
  })

  /***
    Basic Drop Handle Class
   ***

    Has some file upload functionality (mostly legacy <iframe>) but is mainly
    used to handle all drag & drop operations in a cross-browser way.
    You can use it as a basis for your own component.
    Main FileDrop class extends it and listens for produced drop events.
   ***/

  // Parameters:
  // * zone - ID or DOM element which accepts drag & drop. This is often a
  //          <fieldset>. If such element doesn't exist an exception is thrown
  //          when trying to create the class. DropHandle will add some children
  //          to this element to facilitate external drop events. Once created this
  //          element is accessible as (new DropHandle(...)).el property.
  //
  // * opt -  object, key/value pairs of options. See the code for the list of
  //          keys and their purpose. Can be omitted or empty to use defaults.
  //          Current option values are accessible as the opt property.
  //
  //? new fd.DropHandle('anID')
  //? new fd.DropHandle(document.body, {zoneClass: 'with-filedrop'})
  global.DropHandle = function (zone, opt) {
    // Persistent 'this' instance reference.
    var self = this

    self.el = zone = global.byID(zone)
    if (!zone) { throw 'Cannot locate DOM node given to new FileDrop class.' }

    /***
      DropHandle Options
     ***

      Changing these on runtime after the class was created doesn't affect
      anything so make sure to pass desired values to the constructor.
     ***/

    self.opt = {
      // The zone element gets this HTML class appended immediately after
      // the DropHandle object is created.
      zoneClass: 'fd-zone',

      // DropHandle creates a hidden form and <input type="file">. The input
      // is completely transparent so the contents underneath is visible
      // but at the same time a dropped object lands on the input triggering
      // its DOM events. This option specifies the class name assigned
      // to this input.
      inputClass: 'fd-file',

      // Options for fallback upload via <iframe> for browsers lacking
      // native drag & drop support - IE and others.
      iframe: {
        // URL to send uploaded file to. It's a regular form upload with
        // enctype="multipart/form-data" so if you're using PHP it's handled
        // with $_FILES as usual. The URL can have query string. It will have
        // the 'fd-callback' parameter appended containing the name of
        // function your server script must call when generating JavaScript
        // output - if it does the upload succeeds, otherwise it "fails".
        // Calling external function is the only reliable way to know that
        // we've uploaded the file right. Plus you can pass any data to
        // that function as its parameters.
        // For the practical server-side example see included upload.php.
        //
        // If unset <iframe> upload is disabled so only drag & drop-aware
        // browsers (Firefox and Crhome-based) will handle this drop zone.
        url: '',

        // Name of GET input variable containing the name of the global window
        // callback function to be called by the server in the generated
        // page after uploading a file via <iframe>.
        callbackParam: 'fd-callback',

        // Name of POST file input variable (<input type="file" name="$nameParam">).
        // Maps to $_FILE[] in PHP.
        fileParam: 'fd-file'
      },

      // Contains DOM nodes of fallback upload via <iframe>. If null necessary
      // elements for <iframe> upload will be created automatically.
      //
      // If this is false (boolean) then DropHandle creates no input at all.
      // This is useful if you need pure drag & drop upload that works in
      // Firefox and Chrome-based browsers, no <iframe> uploads for IE 9-,
      // Opera, Safari and others. This creates "perfect" drop zone that
      // doesn't prevent user interaction with underlying components so the
      // zone can be extended onto large document area or the entire window.
      input: null,

      // After construction opt.input's structure is as follows: {
        // If unset DropHandle will first recursively look for <input type="file">
        // among the children of the zone element and having opt.inputClass among
        // its HTML classes. If found no new element will be created. This makes it
        // safe to create multiple DropHandle objects for the same zone handle (not
        // tested though).
        //
        // If unset but no suitable node would be found (see above) then DropHandle
        // creates the input automatically along with the form which is usually
        // exactly what you need.
        //file: null,

        // This value is set to match the parent form of <input type="file">.
        // Changing it isn't recommended.
        //form: null
      //},

      // If using <input type="file"> (legacy <iframe> upload, see input option)
      // some browsers including IE 6-10 and Opera will keep last selected file
      // in the input after upload which will prevent the user from uploading
      // the same file twice in a row (this doesn't apply to drag & drop uploads).
      // When enabled, this option will let FileDrop recreate the file input
      // thus resetting file selection. This is safe in most cases but if your
      // project does some extra customization on opt.input.file this might erase
      // them and attached events unless you are doing that in inputSetup event.
      // When disabled, input will be cleared in Firefox/Chrome thus preventing
      // user from reuploading the same file one after another in other browsers.
      recreateInput: true,

      // Chrome, unlike Firefox, dispatches drop events for the entire document
      // rather than the input element. For Chrome this option is always true.
      // If you want the same behaviout in Firefox then you can manually set
      // it to true to let all of your drop zones receive drop events as soon
      // as they enter the browser's window but not those zones' bounds.
      fullDocDragDetect: false,

      // Initial state of the multiple selection in browser's Open File dialog
      // appearing when clickin on the drop zone (<input type="file">).
      // After this object was created toggle this setting with this.multiple().
      multiple: false,

      // Cursor displayed when a user drags an object over this drop zone.
      // Working values depend on the browser. 'copy' and 'none' work for
      // Firefox and Chrome; the latter also supports 'move', 'link'.
      // Setting to 'none' will cause "No Drop" cursor and will cause drop
      // operation to be ignored on this drop zone (on-drop event not fired).
      // This option can be set on runtime.
      dropEffect: 'copy'
    }

    // Keeping track of all DropHandle instances.
    global.all.push(self)
    // If this DropHandle was created by a FileDrop instance this property
    // will point to that instance.
    self.filedrop = null

    var iframe = self.opt.iframe
    global.extend(self.opt, opt, true)
    // In case user options contained {iframe} without full set of properties.
    global.extend(self.opt.iframe, iframe)

    // Chrome dispatches drop events document-wise rather than zone-wise.
    // If unset we won't receive any reaction on individual elements.
    global.isChrome && (self.opt.fullDocDragDetect = true)

    /***
      DropHandle Events
     ***

      Attach new listeners with (new DropHandle).event('dragEnter', function ...).
      As a low-level alternative you can change/move items around this array
      directly but it's not future-proof.

      Note that all callbacks are executed with 'this' pointing to this
      object so it's easy to know which DropHandle has caused that particular
      event. For example:

        var dh = new DropHandle('myzone')
        dh.event('dragEnter', function () {
          alert('Entering the ' + this.el.id + ' drop zone!')
        })
     ***/

    self.events = {
      // Object-wise event preview handlers. They get executed on any event
      // of this object (like dragEnter) and if any of them returns a non-null
      // and non-undefined value actual event handlers are not called and
      // that value is returned. These callbacks receive the same arguments
      // as the target event plus that event's name in front.
      // See callAllOfObject() for more details.
      any: [],

      // Occurs when a user drags something across this zone element (Firefox)
      // or across the entire browser window (Chrome or if opt.fullDocDragDetect
      // is set).
      //
      // function (eventObject)
      dragEnter: [],

      // Occurs when user drags the object away from the zone element (Firefox)
      // or outside of the window (Chrome or opt.fullDocDragDetect).
      //
      // function (eventObject)
      dragLeave: [],

      // Occurs periodically after dragEnter while user is still dragging an
      // object inside the drop zone. If not using DropHandle be aware that
      // Chrome requires a listener attached to ondragover or it will discard
      // the drop operation. DropHandle takes care of this for you.
      //
      // function (eventObject)
      dragOver: [],

      // The following 2 events are somewhat superficient and not really useful
      // or working but they're still listened to in case you need to hook them.
      //
      // function (eventObject)
      dragEnd: [],
      dragExit: [],

      // Occurs when a file has been dropped on the zone element or when a file
      // was selected in/dropped onto fallback <form> to trigger <iframe> upload.
      // The former occurs in Firefox and Chrome-based browsers that support
      // drag & drop natively. The latter occurs in Opera and others that only
      // work with regular form file uploads.
      //
      // function (eventObject)
      //    - is passed native browser-dependent event object.
      upload: [],

      // Occurs when another DropHandle object on the page initiates upload
      // event. Can be used to reset some visual state of all drop zones but
      // the one that's actually got the file landed.
      //
      // function (DropHandle)
      //    - is passed another DropHandle object that has initiated the
      //      upload event.
      uploadElsewhere: [],

      // Occurs after <input type="file"> used to accept file drops was created
      // or found (see the description of the 'input' option). Here it's used to
      // assign it some HTML classes. You can do similar setup.
      // Is also fired after recreating file input on upload if opt.recreateInput
      // is set - in this case is passed old <input type="file"> (that was cloned).
      //
      // function ({ file: DOM_Input, form: DOM_Form }, oldFileInput)
      //    - is passed an object with the same keys as 'input' option -
      //      the DOM element of the <input type="file"> and its parent
      //      <form> DOM element.
      inputSetup: [],

      // Occurs when a fallback <iframe> element was created. Can be used for
      // setup actions similar to inputSetup.
      //
      // function (DOM_Iframe)
      //    - is passed the DOM element of the new <iframe>.
      iframeSetup: [],

      // Occurs when a file was successfully uploaded to the server, i.e.
      // when the form was submitted and the server has returned the output
      // that calls 'fd-callback' function to indicate successful (or unsuccessful)
      // upload to the client page. See the 'iframe' option and included upload.php
      // for samples and explanations.
      //
      // function (response)
      //    - is passed the same data as given by the server-generated JavaScript
      //      to the global 'fd-callback'. Note that it's the first argument to
      //      that function, all others are ignored.
      //      This object will mimic some of XMLHttpRequest properties so you
      //      can use single handler for both XHR and <iframe> uploads - see
      //      sendViaIFrame() for details.
      iframeDone: []
    }

    // Old FireDrop compatibility. Now deprecated.
    self.on = self.events
    self.zone = self.el

    /***
      DropHandle Methods
     ***/

    // Prepares target DOM element for drag & drop and <iframe> uploads by
    // adding more child nodes and listening to appropriate events.
    // Usually you don't need to call this function since it's automatically
    // called for the zone element (given to the constructor).
    //
    //? hook(byID('myzone'))
    self.hook = function (zoneNode) {
      // If <input type="file"> support was turned off then we're not aiming
      // for the support of uploads without File API, i.e. via <iframe> for
      // all but Firefox and Chrome. If such we're not creating the form and
      // other supportive elements.
      if (self.opt.input != false) {
        self.opt.input = self.opt.input || self.prepareInput(zoneNode)
        self.opt.input && global.callAllOfObject(self, 'inputSetup', self.opt.input)
      }

      self.hookDragOn(zoneNode)
      self.hookDropOn(zoneNode)
    }

    // Attaches listeners for drag events - when an object is moved in or out
    // the scope of the zone element (or document for Chrome). This provides
    // common layer for various browser-specific ways to utilize drag* events.
    // Once a suitable event occurs DropHandle's own event callbacks are invoked.
    self.hookDragOn = function (zoneNode) {
      // With dragenter we detect when user moves object over our zone or
      // document window to display some feedback.
      //
      // With dragleave we do the opposite and restore previous component state
      // when an object is being moved away or drag & drop is cancelled.

      if (self.opt.fullDocDragDetect) {
        self.delegate(document.body, 'dragEnter')

        global.addEvent(document, 'dragleave', function (e) {
          // Chrome (at least in earlier versions) fires dragleave randomly,
          // this is used to normalize it to just one real occurrence.
          if ((e.clientX == 0 && e.clientY == 0) || global.isTag(e.relatedTarget, 'html')) {
            global.stopEvent(e)
            global.callAllOfObject(self, 'dragLeave', e)
          }
        })
      } else {
        self.delegate(zoneNode, 'dragEnter')
        self.delegate(zoneNode, 'dragLeave')
      }

      self.delegate(zoneNode, 'dragOver')
      self.delegate(zoneNode, 'dragEnd')    // doesn't work anywhere; unused by FileDrop.
      self.delegate(zoneNode, 'dragExit')   // works in Firefox; unused by FileDrop.
    }

    // Attaches listeners to drop events. Just like hookDragOn provides
    // common browser-independent ground by normalizing occurred events
    // and calling DropHandle's own event handlers.
    self.hookDropOn = function (zoneNode) {
      // IE 6-9 fire 'drop' event if you drop a file onto a file input. However,
      // if the form is submitted after this event IE will send empty POST body
      // instead of the actual file data. So handling of this event is disabled here
      // although technically it could've worked since IE 6 if not for that bug (?).
      //
      // Firefox and Chrome-based browsers are the only ones supporting this
      // event which we use to read dropped file data in the FileDrop class.
      global.isIE9 || self.delegate(zoneNode, 'drop', 'upload')
    }

    // Listens for DOM events and initiates corresponding DropHandle's events.
    // Third argument can specify DropHandle's event name if it differs from
    // the DOM event. Propagation of caught events is stopped.
    //
    //? delegate(byID('myzone'), 'dragleave')
    //? delegate(byID('myzone'), 'drop', 'upload')
    self.delegate = function (zoneNode, domEvent, selfEvent) {
      global.addEvent(zoneNode, domEvent.toLowerCase(), function (e) {
        global.stopEvent(e)
        global.callAllOfObject(self, selfEvent || domEvent, e)
      })
    }

    // Finds or creates <input type="file"> used to facilitate non-drag & drop
    // uploads for browsers othat than Firefox and Chrome-based.
    // Returns that input's DOM element and its parent <form> or, if none,
    // throws an exception since there's no meaning in having <input type="file">
    // and no <form> as both are only reuqired for fallback <iframe> upload.
    // This result is assigned to 'input' option.
    self.prepareInput = function (parent) {
      var file = self.findInputRecursive(parent) || self.createInputAt(parent)

      if (file) {
        var form = file.parentNode
        while (form && !global.isTag(form, 'form')) {
          form = form.parentNode
        }

        if (!form) { throw 'FileDrop file input has no parent form element.' }

        // See if the located form has proper target and if that target
        // (supposedly <iframe>) really exists - we don't want to reload
        // the entire document on file upload since it defeats the purpose
        // of AJAX and is probably an error condition.
        var target = form ? form.getAttribute('target') : ''

        if (target && global.isTag(global.byID(target), 'iframe')) {
          // Once here it means the setup is good to go. Return with success.
          return {file: file, form: form}
        }
      }

      // Similarly to opt.input == false this means there's input/form found
      // so turn off <iframe> upload or create our own elements.
      return false
    }

    // Searches for <input type="file"> containing HTML class opt.inputClass
    // among the children of parent. Is used to autodetect pre-created input
    // of a drop zone. parent must be a DOM element.
    // Returns DOM element or null.
    //
    //? // <form id="myzone"><input type="file" class="fd-input"></form>
    //  findInputRecursive(byID('myzone'))
    //    //=> <input type="file" class="fd-input">
    //
    //? findInputRecursive(byID('foo'))   //=> null
    self.findInputRecursive = function (parent) {
      for (var i = 0; i < parent.childNodes.length; i++) {
        var node = parent.childNodes[i]

        if (global.isTag(node, 'input') && node.getAttribute('type') == 'file' &&
            global.hasClass(node, self.opt.inputClass)) {
          return node
        } else if (node = arguments.callee(node)) {
          return node
        }
      }
    }

    // Creates elements necessary for <iframe> upload to work - the input,
    // form and iframe itself. A random unique ID is generated and assigned to
    // the iframe, plus new form's target attribute. Once <input type="file">
    // gets clicked (and file chosen in the appeared dialog) or once it gets
    // a file dropped onto (supported by some browsers) its onchange event
    // occurs which we're intercepting in hookDropOn(). With that we trigger
    // <form> submission which sends data to our hidden <iframe>. Just like
    // old times.
    //
    // Returns the DOM element of (new) <input type="file">.
    self.createInputAt = function (parent) {
      do { var id = global.randomID() } while (global.byID(id))

      var cont = document.createElement('div')
      // <iframe> code and several other things around are courtesy of
      // QQ File Uploader (https://github.com/valums/file-uploader).
      cont.innerHTML = '<iframe src="javascript:false" name="' + id + '"></iframe>' +
                       '<form method="post" enctype="multipart/form-data">' +
                         '<input type="hidden" name="' + self.opt.iframe.callbackParam + '" />' +
                         '<input type="file" name="' + self.opt.iframe.fileParam + '" />' +
                       '</form>'

      // <iframe>.
      cont.firstChild.setAttribute('id', id)
      cont.firstChild.style.display = 'none'
      // <form>.
      cont.lastChild.setAttribute('target', id)

      var nextChild = parent.firstChild
      // Opera doesn't recognize <legend> and doesn't put it on top of the fieldset
      // unless it's the first child. For this we skip over <legend> which can
      // happen if parent is a <fieldset>.
      while (nextChild && (!global.isTag(nextChild) || global.isTag(nextChild, 'legend'))) {
        nextChild = nextChild.nextSibling
      }

      // Now put our controls as first child so they overlap the contents and
      // <input type="file"> can be clicked or dropped onto to fire the events.
      if (nextChild) {
        // Firefox 10 requires that immediate parent has position: relative for
        // overflow: hidden to work on the input this in turn requires that the
        // parent is the first child, otherwise top: 0 of the file input won't work.
        parent.insertBefore(cont, nextChild)
      } else {
        // parent has no children or it's just <legend> - append controls to the end.
        parent.appendChild(cont)
      }

      // The file input.
      return cont.lastChild.lastChild
    }

    // Can be used to abort <iframe> upload. Isn't guaranteed to work since
    // it's unreliable and highly browser-dependent (especially IE) but at
    // least it might work. Does nothing if this DropHandle doesn't use
    // <iframe> upload (see the input option).
    self.abortIFrame = function () {
      if (self.opt.input.form) {
        var iframe = global.byID(self.opt.input.form.getAttribute('target'))
        iframe && iframe.setAttribute('src', 'javascript:false')
      }
    }

    // Sends the data via <iframe> as a fallback for proper File API AJAX upload.
    // If url is omitted iframe.url option is used. See its description for more
    // info. Does nothing if this DropHandle doesn't use <iframe> upload (see
    // the input option). FileDrop class calls this automatically if an upload
    // was triggered by an unsupported browser (neither Firefox nor Chrome-based).
    //
    // Unlike FileAPI events that let you decide what to do with the file - read,
    // upload or descrad it - <iframe> upload is an imitation that simply submits
    // the form as logn as <input type="file"> was changed according to onchange
    // event. There's no way to make sure it was populated or retrieve any info
    // about the file - this can only be done by the server which may return
    // something useful in response. For this reason DropHandle automatically
    // facilitates the upload and offers only one 'iframeDone' event when all
    // went fine.
    //
    // Returns true if upload was sent (but no guarantees about its success,
    // use 'iframeDone' event for this purpose).
    //
    //? sendViaIFrame('http://my.host/upload.php?var=foo&var2=123')
    //? sendViaIFrame()   // uses opt.iframe.url
    self.sendViaIFrame = function (url) {
      url = url || self.opt.iframe.url
      var form = (self.opt.input || {}).form

      if (url && form) {
        do { var callback = global.randomID() } while (callback in window)

        // This function is meant for calling by the code generated by the
        // server-side script to which we've sent the file via the <form>.
        // callback is that function's globally unique name (window-wise).
        window[callback] = function (resp) {
          // If server didn't pass a JS object let's mimic XMLHttpRequest
          // and put that response data there.
          if (typeof resp != 'object') {
            resp = {
              response: resp,
              responseXML: '',
              responseText: (resp || '').toString(),
              readyState: 4,
              status: 200,
              statusText: 'OK',
              // A bunch of XMLHttpRequest/jqXHR stub methods.
              getAllResponseHeaders: function () { return '' },
              getResponseHeader: function () { return '' },
              setRequestHeader: function () { return this },
              statusCode: function () { return this },
              abort: function () { return this }
            }
          }

          // These are extra properties given to event handlers so they
          // can differentiate between AJAX upload and <iframe> fallback.
          // Note that if properties with these names are already present
          // in response they won't be overwritten.
          global.extend(resp, {
            // Just an indicator that it's an upload via <iframe>.
            iframe: true,
            // This URL contains full URL to which the data was sent (usually
            // opt.iframe.url) that might include 'fd-callback' parameter.
            url: url
          })

          global.callAllOfObject(self, 'iframeDone', resp)
        }

        // Setting the hidden input with the callback name to our newly generated name.
        var cbInput = form.firstChild
        while (cbInput && (!global.isTag(cbInput, 'input') ||
               cbInput.name != self.opt.iframe.callbackParam)) {
          cbInput = cbInput.nextSibling
        }

        if (cbInput) {
          cbInput.value = callback
        } else {
          // This shouldn't happen with standard usage but if the hidden field
          // is missing let's append callback name to the URL itself.
          url = url.replace(/[?&]+$/, '') +
                (url.indexOf('?') == -1 ? '?' : '&') +
                self.opt.iframe.callbackParam + '=' + callback
        }

        form.setAttribute('action', url)
        global.callAllOfObject(self, 'iframeSetup', form)
        form.submit()
        setTimeout(self.resetForm, 300)

        return true
      }
    }

    // Clears value of the file input so that the same file (with the same
    // local path) can be uploaded again without reloading the page.
    // Thanks to @rafaelmaiolla for the tips.
    self.resetForm = function () {
      var input = self.opt.input && self.opt.input.file
      if (input) {
        // Works in Firefox/Chrome only. Funny fact is that cloneNode() there
        // will clone file selection too. IE doesn't support value = '' but
        // node cloning erases it.
        input.value = ''

        if (self.opt.recreateInput) {
          var clone = self.opt.input.file = input.cloneNode(true)
          input.parentNode.replaceChild(clone, input)
          global.callAllOfObject(self, 'inputSetup', [self.opt.input, input])
        }
      }
    }

    // Toggles selection of multiple files in the browser's open file dialog
    // that appears when you click on <input type="file">. Does nothing if
    // this DropHandle doesn't use <iframe> upload (see the input option).
    //
    // If an argument is given it's used to set the new state. If no arguments
    // are passed then current state is read.
    //
    // When doing initial setup on object construction you can pass {multiple: true}
    // as an option instead of calling this method right after.
    //
    //? multiple(true)    //=> true; multiple file selection is possible
    //? multiple(false)   //=> false; only one file can be selected
    //? multiple()        //=> true if multiple selection is enabled or false otherwise
    //? multiple(undefined)   // equivalent to above
    self.multiple = function (enable) {
      if (self.opt.input && typeof enable != 'undefined') {
        enable ? self.opt.input.file.setAttribute('multiple', 'multiple')
               : self.opt.input.file.removeAttribute('multiple')
      }

      return self.opt.input && !!self.opt.input.file.getAttribute('multiple')
    }

    // Function to manipulate events that correspond to DropHandle's events - not
    // DOM node events. If you need to listen to them instead then use this:
    //   addEvent(yourDropHandle.el, 'mousemove', function ...)
    // Or any other standard way, e.g. with jQuery:
    //   $(yourDropHandle.el).mousemove(function () { ... })
    //
    // Without parameters returns copy of {event: [func, func, ...], ...}
    // event map - all handlers attached to this zone.
    //
    // When given a single non-array parameter returns array of handlers
    // of that particular event:
    //   event('iframeDone')     //=> [function () { ... }, func, ...]
    //
    // When givne a single array parameter acts similarly to parameterless
    // form - returns event map of those particular events:
    //   event(['inputSetup', 'iframeDone'])
    //     //=> { inputSetup: [function () { ... }], iframeDone: [func, ...] }
    //
    // When givne one object parameter - an event map - all its handlers
    // are added (values can be either functions or arrays, namespaces are
    // not supported by this call form):
    //   event({ inputSetup: [func, func, ...], iframeDone: func })
    //     //=> this (DropHandle)
    //
    // When given two parameters and the second is null removes all handlers
    // of event(s) listen in the first parameter (array or string):
    //   event('inputSetup', null)    //=> this (DropHandle) - and below
    //   event(['inputSetup', 'iframeDone'], null)
    //
    // When given two parameters and the second is either a function or array
    // adds listeners to listed event(s):
    //   event('inputSetup', function () { alert('New listener') })
    //     //=> this (DropHandle) - here and below
    //   event(['inputSetup', 'iframeDone'], function () { ... })
    //   event('inputSetup', [func_1, func_2, ...])
    //   event(['inputSetup', 'iframeDone'], [func_1, func_2, ...])
    //
    // Since two parameter-long calls return 'this' you can easily chain
    // multiple calls to the object methods like in jQuery.
    //
    // New listeners are pushed at the end of event chain (see callAll()).
    // Use preview() to add handlers in front of others.
    //
    // Event names can contain namespaces in form 'event:namespace' - this
    // string identifier (not necessary unique) is assigned to every function
    // handler and can be used later to remove that handler or a bunch of others
    // with the same ID. Empty namespace ('event:') is the same as just 'event'.
    // Registering new handler with the same NS in the same event doesn't remove
    // the former (NS can duplicate). On unlisten, empty event name with non-empty
    // namespace looks over all events.
    //
    //   event('event:myns', [func_1, func_2])
    //     // adds 2 handlers, both under 'myns' namespace.
    //   event('event', func_3)
    //     // adds third function under empty namespace.
    //   event('event:myns', null)    // removes 2 functions added first.
    //   event(':myns', null)   // removes all 'myns' functions from all events.
    //   event('event')   //=> {event: func_3}
    //
    // Any other parameter combination will result in exception.
    //
    // You can preview any event (execute your own handlers before any occurring
    // event's handlers are executed) with 'any' event name (see callAllOfObject()):
    //
    //   event('any', function () { return false })
    //     // suppresses all events.
    //   event('any:myns', function () { return false })
    //     // the same but lets you later remove this namespaced handler.
    //   event('any:myns', null)    // removes the handler set above.
    //
    // There are also more special call forms. With one null parameter all
    // handlers on this zone are removed - can be used to transfer all handlers
    // from one DropHandle to another or save/restore their state:
    //   var old = event()    //=> {event: [func], ...}
    //   event(null)
    //   event(old)
    //
    // With one function parameter this function's namespace is returned
    // or empty strign if there's none:
    //   event(function () { })     //=> ''
    //
    //? event('inputSetup', function (input) {
    //    alert('Setting up file input of ' + input.form.target)
    //  })
    //
    //? event('iframeDone', [handler_1, handler_2, ...])
    //? event(['inputSetup', 'iframeDone'], function () { alert(this.el.id) })
    //? event('any:namespace', ...)
    self.event = function (events, funcs) {
      return global.appendEventsToObject.apply(self, arguments)
    }

    // A simplified companion of event() that adds listeners not after
    // existing but in front of them. Useful for intercepting and overriding
    // calls of certain events. Supports namespaces.
    //
    // Has several call forms which are identical to event():
    // 1. One parameter - object (event map)
    // 2. Two parameters - array/array, array/func, string/array, string/func
    //
    // Any other parameter combination will result in exception.
    //
    //? preview('iframeDone', function () { alert('Abort!'); return false })
    //? preview(['inputSetup:myns'], [func, func])
    //? preview('any:myns', function () { alert('Stop that!'); return false })
    self.preview = function (events, funcs) {
      return global.previewToObject.apply(self, arguments)
    }

    /***
      Standard DropHandle Event Callbacks
     ***

      These are used to support default behaviour like assignment of HTML
      classes to zone and input nodes.
     ***/

    self.onInputSetup = function (input, oldInput) {
      if (oldInput) {
        // IE clones elements "by reference" so when one's attributes or
        // events are changed the other also reflects the change.
        // Taken from jQuery which borrowed that from MooTools.
        input.file.clearAttributes && input.file.clearAttributes()
        input.file.mergeAttributes && input.file.mergeAttributes(oldInput)
      } else {
        self.multiple(self.opt.multiple)
      }

      global.setClass(input.file, self.opt.inputClass)

      // We listen for <input type="file">'s onchange event - when it occurs
      // we trigger submission of the hidden form which navigates hidden
      // <iframe> to upload the file to the server script and read its response.
      // This can be used in drag & drop-aware browsers (Firefox and Chrome-based)
      // to create a "Browse for file" button as an alternative to drag & drop.
      // For more details see the 'iframe' option.
      self.delegate(input.file, 'change', 'upload')

      var parent = input.file.parentNode
      if (parent && parent.style.display.match(/^(static)?$/)) {
        // We need to anchor <input>'s position relative to its parent node.
        parent.style.position = 'relative'
      }

      if (global.isTag(zone, 'fieldset')) {
        // Firefox 13 or so has started to ignore overflow: hidden on fieldsets.
        // We need to wrap it in a <div> that by itself will hide any overflow.
        var div = document.createElement('div')
        div.style.position = 'relative'
        div.style.overflow = 'hidden'
        zone.parentNode.insertBefore(div, zone)
        div.appendChild(zone)
      }
    }

    self.onDragOver = function (e) {
      global.stopEvent(e)
      e.dataTransfer && (e.dataTransfer.dropEffect = self.opt.dropEffect)
    }

    self.onUpload = function () {
      for (var i = 0; i < global.all.length; i++) {
        if (global.all[i] !== self && global.all[i].events) {
          global.callAllOfObject(global.all[i], 'uploadElsewhere', self)
        }
      }
    }

    self.event({
      inputSetup: self.onInputSetup,
      dragOver: self.onDragOver,
      upload: self.onUpload
    })

    // Initialization.
    global.setClass(zone, self.opt.zoneClass)
    self.hook(zone)
  }

  /***
    Main FileDrop Class
   ***

    Based on DropHandle to abstract from browser-specific drag & drop
    and fallback <iframe> upload quirks, this class adds actual upload
    functionality. It listens for drop events and <iframe> submission
    triggering dedicated events with normalized parameters. Underlying
    DropHandle class can be accessed via this.handle property. It shares
    options and events with FileDrop object so changing one affects another.

    DropHandle properties and methods are available on this object as well.

    This object is defined in window.fd and aliased as window.FileDrop.
   ***/

  // Parameters - identical to DropHandle, see its note for details.
  //? new FileDrop('anID')
  //? new FileDrop(document.body, {zoneClass: 'with-filedrop'})
  global.FileDrop = function (zone, opt) {
    // Persistent 'this' instance reference.
    var self = this

    zone = global.byID(zone)

    // Underlying DropHandle instance providing browser-independent
    // handlers for drag & drop and <iframe> upload facility.
    // Constructor will throw an exception if zone is invalid/undefined.
    self.handle = new global.DropHandle(zone, opt)
    self.handle.filedrop = self

    /***
      FileDrop Options
     ***

      Changing these on runtime after the class was created doesn't affect
      anything so make sure to pass desired values to the constructor.

      Extends DropHandle options so check that class for more options and info.
     ***/

    global.extend(self.handle.opt, {
      // HTML class name for the zone DOM node that is set when an object
      // is being dragged over that zone (Firefox) or over entire document
      // (Chrome-powered browsers). It's removed once the object was dragged
      // away or drag & drop was cancelled.
      dragOverClass: 'over'
    })

    global.extend(self.handle.opt.iframe, {
      // opt.iframe.force - if set FileDrop will always upload files by using
      // fallback <iframe> method. This only makes sense in debugging and
      // for some browsers (Opera before migrating to Chrome engine).
      force: false
    })

    /***
      FileDrop Events
     ***

      Attach new listeners with (new FileDrop).event('send', function ...).
      Extends DropHandle options so check that class for more events and info.

      This only applies to FileDrop zone overall - it doesn't define events
      for individual File objects being generated by this zone. This means
      that to determine upload state or progress you need to attach listeners
      to each produced File object - either inside FileDrop's 'send' event
      before sending a file to the server or inside its 'fileSetup' event
      which is fired right after the creation of File object.

      Note that all callbacks are executed with 'this' pointing to this
      object so it's easy to know which FileDrop has caused that particular
      event. For example:

        var dh = new FileDrop('myzone')
        dh.event('send', function (files) {
          alert('Sending files via ' + this.el.id)

          for (var i = 0; i < files.length; i++) {
            files[i].sendTo('http://my.host/upload.php')
          }
        })
     ***/

    global.extend(self.handle.events, {
      // Occurs when a file is ready to be sent via drag & drop. Doesn't
      // occur for <iframe> uploads since the only thing you can do about them
      // is submit the file to the server (no file info is available).
      // If for some reason you still need to know when a file was *potentially*
      // placed into <input type="file"> for such fallback uploads listen or
      // preview the 'upload' event (inherited from DropHandle).
      //
      // function (fd.FileList)
      //    - is passed list of files that were dropped onto this zone - see
      //      the description of this object for more details.
      send: [],

      // Occurs when a new fd.File object was created. You can use this to
      // attach your own events if you don't want to do this on every 'send'
      // occurrence.
      //
      // function (fd.File)
      //    - is passed instance of the newly created File object.
      fileSetup: []
    })

    // Handles upload that happens when a user drops a file onto the zone
    // (Firefox, Chrome-based) or its <input type="file" (Opera, others).
    self.onUpload = function (e) {
      var files = !self.opt.iframe.force && self.eventFiles(e, true)

      // This was likely triggered by onchange event of <input type="file">
      // which means the browser doesn't support drag & drop or the user
      // has picked file by clicking on the drop zone, bringing up Open File
      // dialog and selecting a file there.
      // If that's the case we don't have any file info available so just
      // submit the form to the server and see what it responds with (only
      // if <iframe> upload was enabled by filling out opt.iframe.url).
      if (!files) {
        if (!self.handle.sendViaIFrame() && global.hasConsole) {
          // Must set opt.iframe.url if <iframe> fallback needs to work.
          console.warn('FileDrop fallback upload triggered but iframe options' +
                       ' were not configured - doing nothing.')
        }
      } else if (files.length > 0) {
        // Dropped one or more files and we have FileAPI available (Firefox,
        // Chrome-based) so fire off the usual on-drop event.
        global.callAllOfObject(self, 'send', [files])
      }
    }

    // Retrieves fd.File objects from an on-drop event. Returns a fd.FileList
    // array-like object (not W3C FileList).
    // If orFalse is unset always returns a FileList even if event was invalid,
    // otherwise returns false in such occurrences instead of empty FileList.
    self.eventFiles = function (e, orFalse) {
      var result = new global.FileList(e)

      // IE 8 supplies dataTransfer but it's of its own format (getData(), etc.)
      // and not standardized. Has no file objects.
      if (e.dataTransfer && (e.dataTransfer.length || e.dataTransfer.files)) {
        var list = e.dataTransfer
      } else {
        // IE 10 provides dataTransfer on drag & drop but when selecting with
        // Open File dialog of <input type="file"> it only has e.srcElement.files.
        // Thanks to @rafaelmaiolla for this correction.
        var list = (e.target && e.target.files) || (e.srcElement && e.srcElement.files)
      }

      if (list) {
        var entries = list.items || []
        list.files && (list = list.files)   // Firefox 3.6.
        var names = {}

        for (var i = 0; i < list.length; i++) {
          var file = new global.File(list[i])

          // Safari Windows adds first file several times so skip them.
          // ...while iOS Safari adds files under the same name - image.jpg (#30).
          if (!names[file.name] || file.name == 'image.jpg') {
            names[file.name] = true
            file.setNativeEntry(entries[i])
            global.callAllOfObject(self, 'fileSetup', file)

            // Directories have zero size but in Chrome they are useful
            // since you can access underlying DIrectoryEntry and read files.
            if (file.size > 0 || file.nativeEntry) {
              result.push(file)
            }
          }
        }
      } else if (orFalse) {
        result = false
      }

      return result
    }

    // Linking both classes together. Objects become references so changing,
    // for example, handle.events affects this.events. Functions of DropHandle
    // become available on this FileDrop instance which is fine since they
    // operate on 'self' bound to DropHandle object rather than 'this' of FileDrop.
    global.extend(self, self.handle)

    /***
      Standard FileDrop Event Callbacks
     ***

      These are used to support default behaviour like actual upload process
      after dropping a file or updating zone HTML classes on drag over/out.
     ***/

    function dragClassChanger(isHovered) {
      return function () {
        global.setClass(zone, self.opt.dragOverClass, isHovered)
      }
    }

    self.event({
      upload:           self.onUpload,
      send:             self.resetForm,
      // Add/remove on-drag HTML classes to/from the zone element.
      dragEnter:        dragClassChanger(true),
      dragLeave:        dragClassChanger(false),
      uploadElsewhere:  dragClassChanger(false)
    })

    self.preview({
      // Placing handler to reset on-drop state of the zone for better
      // visual feedback - the user immediately recognizes that the file is no
      // more dragged even if actual upload handler takes some time to execute.
      upload:           dragClassChanger(false)
    })
  }

  /***
    FileList Class
   ***

    It's sort of W3C class (that has no special methods defined in the spec)
    with a bunch of File-oriented methods that this object is meant to contain.
    It's an array-like object with length, splice and other methods.
   ***/

  global.FileList = function (event) {
    // Persistent 'this' instance reference.
    var self = this

    // If set can be 'copy', 'move' or other action. Doesn't reliably work
    // cross-browser and cross-platform. See MDN for more info:
    // https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer
    self.dropEffect = (event && event.dropEffect) || ''
    self.length = 0

    // No need to hold the reference to this variable.
    event = null

    self.push = function (file) {
      self[self.length++] = file
      return self
    }

    // Returns undefind if this list is empty.
    self.pop = function () {
      if (self.length > 0) {
        var file = self.last()
        delete self[--self.length]
        return file
      }
    }

    self.first = function () {
      return self[0]
    }

    self.last = function () {
      return self[self.length - 1]
    }

    self.remove = function (i) {
      for (; i < self.length - 1; i++) {
        self[i] = self[i + 1]
      }

      se.f.pop()
      return self
    }

    self.clear = function () {
      for (var i = 0; i < self.length; i++) {
        delete self[i]
      }

      self.length = 0
      return self
    }

    // Reverses order of files in this list (changes self).
    self.reverse = function () {
      for (var i = 0; i < Math.floor(self.length / 2); i++) {
        self[i] = self[self.length - i - 1]
      }
      return self
    }

    // Creates copy of this list and adds items from FileList or array
    // to the end of the returned copy.
    self.concat = function (list) {
      var copy = new global.FileList
      for (var i = 0; i < self.length; i++) {
        copy[i] = self[i]
      }

      for (var i = 0; list && i < list.length; i++) {
        copy[self.length + i + 1] = list[i]
      }

      copy.length = self.length + (list || []).length
      return self
    }

    // Sorts this list by calling comparator in context cx (or 'this' FileList).
    // func = function (File a, File b, aIndex, bIndex) - if returns < 0 second
    // file (b) must go before first (a). Very similar to Array.sort().
    //
    //? sort(function (a, b) { return a.name > b.name ? +1 : -1 })
    self.sort = function (func, cx) {
      for (var i = 0; i < self.length; i++) {
        for (var j = 0; j < self.length; j++) {
          if (func.call(cx || this, self[i], self[j], i, j) < 0) {
            var temp = self[i]
            self[i] = self[j]
            self[j] = temp
          }
        }
      }

      return self
    }

    // Sorts this list by calling func on each File alone and using that value
    // (hash) to compare itsems between themselves. Like Underscore's sortBy().
    // func = function (File, index) - returns something comparable, e.g. string,
    // number or Date.
    //
    //? sortBy(function (file) { return file.modDate })
    //? sortBy(function () { return Math.random() })
    self.sortBy = function (func, cx) {
      var list = []

      for (var i = 0; i < self.length; i++) {
        list.push([ i, func.call(cx || this, self[i], i) ])
      }

      list.sort(function (a, b) {
        return a[1] > b[1] ? +1 : (a[1] < b[1] ? -1 : 0)
      })

      for (var i = 0; i < list.length; i++) {
        self[i] = list[i][0]
      }

      return self
    }

    // Calls func in context cx for every File in the list and if it returns
    // a non-null value returns the File object on which func was invoked.
    // If this list is empty or if func didn't return anything for any file
    // returns undfined.
    //
    //? find(function (f) { return f.name[0] == 'a' })
    //    // returns first File which local name starts with 'a', if any.
    self.find = function (func, cx) {
      for (var i = 0; i < self.length; i++) {
        var res = func.call(cx || this, self[i], i)
        if (res != null) { return self[i] }
      }
    }

    // The same as find() but ignores returned value of the callback invoking
    // it for every File in the list.
    //
    //? each(function (f) { alert(f.name) })
    self.each = function (func, cx) {
      self.find(function () { func.apply(this, arguments) }, cx)
      return self
    }

    // Calls method on every contained object with given arguments. Returns self.
    //
    //? invoke('fileMethod', 'arg1', 2, 3.33)
    self.invoke = function (method, arg_1) {
      var args = global.toArray(arguments, 1)
      return this.each(function (file) { file[method].apply(file, args) })
    }

    // Aborts all uploads of files contained in this list. Does nothing if
    // upload isn't active. Doesn't abort <iframe> uploads - for this call
    // abortIFrame() on the corresponding DropHandle object.
    //
    //? abort()
    self.abort = function () {
      return this.invoke('abort')
    }

    // Runs through over all items in this list calling func in context cx (or
    // this) and storing returned values. Returns File object for which func
    // generated the largest value (or first such File for multiple same values).
    // Returns undefined if this list is empty.
    //
    //? findCompare(function (f) { return f.size })
    //    // returns largest file.
    self.findCompare = function (func, cx) {
      var file, value = null, res

      self.each(function (f) {
        if (value == null || value < (res = func.call(cx, file))) {
          file = f
        }
      }, cx)

      return file
    }

    // Returns new list that only contains items for which func called in context
    // cx (or this) has returned a truthy value.
    self.filter = function (func, cx) {
      var list = new global.FileList

      self.each(function (f) {
        func.apply(this, arguments) && list.push(f)
      }, cx)

      return list
    }

    // Finds File with biggest size or undefined for empty list.
    self.largest = function () {
      return self.findCompare(function (f) { return f.size })
    }

    // Finds File with smallest size or undefined for empty list.
    self.smallest = function () {
      return self.findCompare(function (f) { return -f.size })
    }

    // Finds File that was changed the longest time before or undefined for empty list.
    self.oldest = function () {
      return self.findCompare(function (f) { return -f.modDate.getTime() })
    }

    // Finds File that was most recently changed or undefined for empty list.
    self.newest = function () {
      return self.findCompare(function (f) { return f.modDate })
    }

    // Returns new list of all files which MIME type matches. MIME shouldn't contain
    // RegExp symbols except for '/'. To match MIME group like 'image/*' don't
    // include trailing '/*' - just 'image'.
    //
    //? ofType('image').first()   //=> File or undefined if none
    self.ofType = function (mime) {
      mime += mime.indexOf('/') == -1 ? '/' : '$'
      mime = new RegExp('^' + mime, 'i')
      return self.filter(function (f) { return mime.test(f.type) })
    }

    // Returns new list with File items with image/* MIME type.
    self.images = function () {
      return self.ofType('image')
    }

    // If name is string returns File with name exactly matching that string
    // If name is RegExp returns new list containing File items which 'name'
    // match given RegExp.
    //
    //? named('myfile.txt')     //=> File or undefined
    //? named(/^start_\..+$/i)  //=> FileList (copy)
    self.named = function (name) {
      if (typeof name == 'string') {
        return self.find(function (f) { return f.name == name })
      } else {
        return self.filter(function (f) { return name.test(f.name) })
      }
    }
  }

  // Making FileList array-like.
  global.FileList.prototype.length = 0
  global.FileList.prototype.splice = Array.prototype.splice

  /***
    Browser-Independent File Class
   ***

    It's passed on FileDrop 'send' event as members fd.FileList and provides
    cross-browser access to file information and ability to upload it to the server.
    Wraps around native browser's File object.
   ***/

  // Parameters:
  // * file - native browser File object that was retrieved from the on-drop
  //          event object. Can be accessed via this.nativeFile property.
  global.File = function (file) {
    // Persistent 'this' instance reference.
    var self = this

    // Native browser's File object as it was given in the on-drop event.
    // Is null for directory entries if on lists produced by listEntries().
    self.nativeFile = file

    // In Chrome 21+ will be set to native Entry (FileEntry, DirectoryEntry, etc.)
    // instance. See W3C spec: http://www.w3.org/TR/file-system-api/#the-entry-interface
    self.nativeEntry = null

    // Local file name.
    self.name = file.fileName || file.name || ''

    // Local file size (bytes).
    self.size = file.fileSize || file.size || 0

    // Local file MIME type.
    self.type = self.mime = file.fileType || file.type || ''

    // Last modification of the local time. Standard Date object.
    self.modDate = file.lastModifiedDate || new Date

    // XMLHttpRequest object that was used to upload the file to the server.
    // Only filled after sendTo() was called.
    self.xhr = null

    /***
      File Options
     ***

      Values here specify default values for sendTo() options - like HTTP
      method used to submit the data. They can be overriden by passing an
      object to sendTo() - e.g. sendTo('upload.php', {method: 'PUT'}).
     ***/

    self.opt = {
      // If enabled this object will add several X-... headers to provide
      // information about the original file to the server (e.g. name and size).
      extraHeaders: true,

      // The value of X-Requested-With header sent with XMLHttpRequest used
      // to upload the dropped file(s). If false then this header is not set
      // (but you can use xhrSetup/xhrSend events to set it). If true - it's
      // set to one of 'FileDrop-XHR-...'. A string sets it to that string -
      // e.g. 'XMLHttpRequest' would simulate regular $.ajax() request.
      xRequestedWith: true,

      // HTTP method used to submit the upload data. Useful for contacting
      // WebDAV services which might accept PUT or DELETE. Given in sendTo()
      // to XMLHttpRequest.open().
      method: 'POST'
    }

    /***
      File Events
     ***

      These are different from FileDrop events and are individual to each File.
      See FileDrop events for more info on how to attach listeners here.
     ***/

    self.events = {
      // Object-wise event preview handlers. See DropHandle's 'any' description.
      any: [],

      // Occurs after an XMLHttpRequest object was prepared to submit the file
      // to the server. All FileDrop-specific headers and other customization
      // (Content-Type, etc.) was already done. You can set extra headers or add
      // event listeners here before it's dispatched to the server.
      //
      // function (XMLHttpRequest, opt)
      //    - is passed the request object and the options object that was
      //      passed to sendTo() with missing fields populated as this.opt.
      xhrSetup: [],

      // Occurs when a file and XMLHttpRequest were prepared for upload and need
      // to be sent. It's handled by fd.File.xhrSend() but you might want to
      // add your logic here.
      //
      // function (XMLHttpRequest, data, opt)
      //    - is passed the request object, options and raw file data that is
      //      browser-specific (it might not be raw binary stream in some
      //      older browsers as it is in Firefox and Chrome-based). opt is the
      //      object passed to sendTo() with missing fields populated as this.opt.
      xhrSend: [],

      // Occurs during file upload with information on current upload progress.
      // This happens on browser-sepcific intervals and usually on somewhat large
      // files only.
      //
      // function (sentBytes, totalBytes, XMLHttpRequest, eventObject)
      //    - is passed two integers (already uploaded bytes and total amount
      //      of data - local file size, of which first or both might be unset
      //      if browser can't provide this info), the request object that is
      //      uploading this file and native browser event object that was
      //      given to the XHR's event handler of fd.File.
      progress: [],

      // Occurs when a file has successfully finished uploading.
      //
      // function (XMLHttpRequest, eventObject)
      //    - is passed the request object that was used to upload the file and
      //      native browser event object that was given to the XHR's event handler
      //      of fd.File.
      done: [],

      // Occurs when a file has failed during upload much like regular XHR error.
      // Note that "failing" means all response code except for 200 - even 2xx like
      // 202 Accepted (WebDAV and such) or 3xx (redirects).
      // This isn't called when upload was aborted - if you specifically need to
      // track this call fd.addEvent(fileObject, 'abort', function ...).
      //
      // function (eventObject, [XMLHttpRequest])
      //    - using passed objects you can determine the type of error as you
      //      would outside of FileDrop - e.g. by XMLHttpRequest.statusText.
      //      If XHR object is not passed this marks an error that has occurred
      //      while reading file from local file system with readAsArrayBuffer().
      error: []
    }

    // Old FireDrop compatibility. Now deprecated.
    self.events.sendXHR = self.events.xhrSend

    /***
      File Methods
     ***/

    // Aborts current upload, if any.
    //
    //? file.abort()
    self.abort = function () {
      self.xhr && self.xhr.abort && self.xhr.abort()
      return self
    }

    // Submits the dropped file to the server script at given URL and with
    // optional options (fields default to this fd.File.opt).
    // Incapsulates browser-specific logic behind reading a local file.
    // If an upload request has been already made on this fd.File instance will
    // abort it (unless it's finished) and start anew.
    //
    //? sendTo('http://my.host/upload.php?var=foo&var2=123')
    //? sendTo('upload.php', {method: 'PUT'})
    self.sendTo = function (url, opt) {
      opt = global.extend(opt, self.opt)
      opt.url = url

      if (!self.size) {
        // Zero size also indicates that it might be a directory.
        global.hasConsole && console.warn('Trying to send an empty FileDrop.File.')
      } else if (window.FileReader) {
        // Using Firefox FileAPI.
        var reader = new FileReader

        reader.onload = function (e) { self.sendDataReadyTo(opt, e) }
        reader.onerror = function (e) { global.callAllOfObject(self, 'error', [e]) }

        reader.readAsArrayBuffer(self.nativeFile)
      } else {
        // Using early Chrome/Safari File API.
        self.sendDataReadyTo(opt)
      }

      return self
    }

    // Internal method that's called when file data was read and is ready for
    // upload. For FileAPI (Firefox) gets called on readAsArrayBuffer() onload
    // event; for Safari/early Chrome it's called immediately and gets passed
    // the native file object itself.
    self.sendDataReadyTo = function (opt, e) {
      self.abort()

      self.xhr = global.newXHR()
      self.hookXHR(self.xhr)

      self.xhr.open(opt.method, opt.url, true)
      // Missing in IE.
      self.xhr.overrideMimeType && self.xhr.overrideMimeType('application/octet-stream')
      self.xhr.setRequestHeader('Content-Type', 'application/octet-stream')

      if (opt.extraHeaders) {
        self.xhr.setRequestHeader('X-File-Name', encodeURIComponent(self.name))
        self.xhr.setRequestHeader('X-File-Size', self.size)
        self.xhr.setRequestHeader('X-File-Type', self.type)
        self.xhr.setRequestHeader('X-File-Date', self.modDate.toGMTString())

        var reqWith = opt.xRequestedWith
        if (reqWith === true) {
          var api = window.FileReader ? 'FileAPI' : 'Webkit'
          reqWith = 'FileDrop-XHR-' + api
        }

        reqWith && self.xhr.setRequestHeader('X-Requested-With', reqWith)
      }

      global.callAllOfObject(self, 'xhrSetup', [self.xhr, opt])

      // Some browsers allow reading raw data, some don't. See if ours allows
      // and if not then it should support just passing the native file object
      // to XMLHttpRequest.send().
      var data = (e && e.target && e.target.result) ? e.target.result : self.nativeFile
      global.callAllOfObject(self, 'xhrSend', [self.xhr, data, opt])
      return self.xhr
    }

    // Attaches internal event listeners to the XMLHttpRequest object that is
    // used to upload the dropped file. Not all browsers trigger upload events
    // on the XHR object itself (hence evtHost).
    self.hookXHR = function (xhr) {
      var evtHost = xhr.upload || xhr

      xhr.onreadystatechange = function (e) {
        if (xhr.readyState == 4) {
          try {
            var event = xhr.status == 200 ? 'done' : 'error'
          } catch (e) {
            var event = 'error'
          }

          var args = event == 'error' ? [e, xhr] : [xhr, e]
          global.callAllOfObject(self, event, args)
        }
      }

      evtHost.onprogress = function (e) {
        var current = e.lengthComputable ? e.loaded : null
        global.callAllOfObject(self, 'progress', [current, e.total || null, xhr, e])
      }
    }

    // Browser-independent way of reading binary data. Doesn't work on all browsers.
    // Asynchronous. If onError is omitted then onDone is called with the usual
    // arguments (errorObject). If onError is false errors are not reported
    // (onDone not called).
    //
    // Third parameter specifies the way to read the file and if omitted or 'bin'
    // reads binary data, if 'url', 'uri' or 'src' reads Data URI (very nice for
    // generating thumbnails), if 'array' reads it as ArrayBuffer, if 'text' reads
    // data as UTF-8 string, if starts with 'read' is assumed to be a method name on
    // native File object which will be called. Any other string value istreated as
    // character encoding (e.g. 'cp1251') and data is read as text in that encoding.
    // If 3rd parameter is an array its first element is treated as File's method
    // name and all other parameters are parameters for that method.
    //
    // Note that readAsBinaryString() is deprecated, missing in IE 10 and simulated
    // by FileDrop using readAsArrayBuffer().
    //
    // errorObject will fdError string property describing the type of the problem:
    // 1. 'read'      - browser has failed to read file data.
    // 2. 'support'   - browser doesn't support File API.
    //
    // onDone   = function (string|array)
    // onError  = function (errorObject)
    //
    //?
    //  readData(function (uri) { byID('myImg').src = uri },
    //           function (e) { alert('Terrible error!') },
    //           'uri')
    //      // reads dropped image into a thumbnail (Data URI).
    //
    //? readData(function (bytes) { alert(bytes) }, false)
    //      // shows message with raw read byte string.
    //
    //? readData(function (bytes) { alert(bytes) }, false, 'bin')
    //      // identical to above.
    //
    //? readData(function (bytes) { alert(bytes) }, false, 'readAsBinaryString')
    //      // identical to above.
    //
    //? readData(function (bytes) { alert(bytes) }, false, ['readAsBinaryString'])
    //      // identical to above but won't automatically fall back to
    //      // readAsArrayBuffer() failing in IE and early Chrome.
    //
    //? readData(function (bytes) { alert(Array.prototype.slice.call(bytes)) }, false, 'array')
    //      // shows message with comma-separated list of byte values.
    //
    //? readData(function (str) { alert(str) }, false, 'cp1251')
    //      // shows message with file read as a string in CP-1251 charset.
    //
    //? readData(function (str) { alert(str), false, ['readAsText', 'cp1251'])
    //      // identical to above.
    //
    //? readData(function (str) { alert(str), false, 'text')
    //      // similar to above but treats string as UTF-8 encoded (default charset).
    //
    //? readData(function (str) { alert(str), false, 'utf-8')
    //      // identical to above.
    //
    //? readData(function (str) { alert(str), false, 'readAsText')
    //      // identical to above.
    self.readData = function (onDone, onError, func) {
      return self.read({onDone: onDone, onError: onError, func: func})
    }

    // Alias to readData() that reads Data URI suitable for <img src> attribute.
    // Unlike readData() if onError isn't passed explicitly it's set to false
    // (errors suppressed, onDone not called instead).
    //
    //?
    //  readDataURI(function (uri) {
    //    var img = new Image
    //    img.src = uri
    //    document.body.appendChild(img)
    //  })
    self.readDataURL = function (onDone, onError) {
      return self.readData(onDone, onError || false, 'uri')
    }

    // Alias to readDataURL().
    self.readDataURI = self.readDataURL;

    // Advanced reading function that can be used to read Blobs and make
    // slices of this file rather than load the entire data into memory.
    // Accepts various options, see the code for information.
    //
    //? read({onDone: function (str) { alert(str) }, func: 'text', start: 0, end: 5})
    //    // reads first 4 bytes of the file, treats them as UTF-8 and shows them.
    self.read = function (opt) {
      function error(reason, e) {
        typeof e == 'object' || (e.message = e)
        e.fdError = reason

        if (opt.onError !== false) {
          (opt.onError || opt.onDone).apply(this, arguments)
        }
      }

      global.extend(opt, {
        // function (data) - gets passed data according to selected func (below).
        onDone: new Function,

        // function (e), false (errors are not reported), null (calls onDone).
        onError: null,

        // Target File or Blob object to read data from.
        blob: self.nativeFile,

        // Reading method alias (e.g. 'uri'), name (e.g. 'readAsText') or
        // array like ['readAsText', 'arg-1', ...].
        func: '',

        // New Blob slice options. Negative becomes 0.
        start: 0,

        // null = this.size. Note that according to W3C byte with this offset
        // is not included in result (so last byte read is end - 1).
        // If negative offset is counted from the end (-1 skips last 2 bytes).
        end: null,

        // contentType assigned to new Blob (empty leaves default).
        mime: ''
      })

      if (!window.FileReader) {
        return error('support', e)
      }

      if (opt.start > 0 || opt.end != null && opt.end) {
        if (opt.blob.slice) {
          opt.end == null && (opt.end = opt.blob.size || opt.blob.fileSize)
          opt.blob = opt.blob.slice(opt.start, opt.end, opt.mime)
        } else if (global.hasConsole) {
          console.warn('File Blob/slice() are unsupported - operating on entire File.')
        }
      }

      var reader = new FileReader
      reader.onerror = function (e) { error('read', e) }

      reader.onload = function (e) {
        if (e.target && e.target.result) {
          if (opt.func == 'readAsBinaryString') {
            // Function actually used was readAsArrayBuffer() - see the note below.
            e.target.result = String.fromCharCode.apply(null, new Uint8Array(e.target.result))
          }

          opt.onDone(e.target.result)
        } else {
          reader.onerror(e)
        }
      }

      var func = opt.func

      if (global.isArray(func)) {
        var name = func[0]
        func[0] = opt.blob
        return reader[name].apply(reader, func)
      } else {
        if (!func || func == 'bin') {
          func = 'readAsBinaryString'
        } else if (func == 'url' || func == 'uri' || func == 'src') {
          func = 'readAsDataURL'
        } else if (func == 'array') {
          func = 'readAsArrayBuffer'
        } else if (func == 'text') {
          func = 'readAsText'   // reads as UTF-8 by default.
        } else if (func.substr(0, 4) != 'read') {
          return reader.readAsText(opt.blob, func)
        }

        // readAsBinaryString() has been deprecated since mid-2012 in favour
        // of readAsArrayBuffer(). Additionally, IE 10 only supports the latter.
        // Result that's been read will be converted to string in onload.
        func == 'readAsBinaryString' && (func = 'readAsArrayBuffer')

        return reader[func](opt.blob)
      }
    }

    // Uses W3C draft File System API to traverse this DirectoryEntry.
    // Currently supported in Chrome 21+. Spec: http://www.w3.org/TR/file-system-api/
    // Thanks to @kevinkrouse for pointing me to this wonderful interface.
    // This function is not recursive.
    //
    // onDone is a function callback that receives FileDrop.FileList object.
    // Each entry there can be either a file or a directory. Files have nativeFile
    // set (but not in case of error - if so use nativeEntry's isDirectory and
    // isFile props to determine which one is which). On these, correct files you
    // can use any of FileDrop methods - sendTo(), readFile(), etc. On directories
    // (but not failed files) you can use listEntries() to traverse them further.
    //
    // onError is an optional function called by the browser when it runs into errors.
    // It gets passed error object. Note that it might be called multiple times
    // and that onDone can be still called (this might happen if FileEntry can't
    // read particular File object when using file()).
    //
    //? listEntries(function (files) { files.images().invoke('sendTo', 'upload.php') })
    //      // sends all images in the dropped directory to upload.php; errors are
    //      // ignored but if one has occurred while retrieving File API object this
    //      // call with fail with a JavaScript error - this is fixed by removing
    //      // all entries with null nativeFile before doing sendTo().
    //
    //? listEntries(function (files) { files.each(...) },
    //              function (e) { alert('File System API error ' + e.code) })
    self.listEntries = function (onDone, onError) {
      if (self.nativeEntry && self.nativeEntry.isDirectory) {
        onError = onError || new Function
        var reader = self.nativeEntry.createReader()
        var files = new global.FileList
        var enqueued = 0

        function dequeue(count) {
          enqueued -= count
          if (enqueued == 0 && onDone) {
            onDone(files)
            onDone = null
          }
        }

        reader.readEntries(function (list) {
          for (var i = 0; i < list.length; i++) {
            var nativeEntry = list[i]

            if (nativeEntry.file) {
              // This entry is a file (FileEntry).
              enqueued++
              nativeEntry.file(
                function (nativeFile) {
                  var file = new global.File(nativeFile)
                  file.setNativeEntry(nativeEntry)
                  files.push(file)
                  dequeue(1)
                },
                function () {
                  // Error getting a File object. Let's still insert it
                  // into the resulting list but without nativeFile (which
                  // makes sendTo(), readData(), etc. unavailable).
                  files.push( global.File.fromEntry(nativeEntry) )
                  dequeue(1)
                  onError.apply(this, arguments)
                }
              )
            } else {
              // This is a DirectoryEntry. It has no File object (that comes
              // from File API spec: http://dev.w3.org/2006/webapi/FileAPI/).
              // Don't try calling sendTo(), readFile() and the likes on the
              // FileDrop.File items returned in the FileList passed to onDone.
              files.push( global.File.fromEntry(nativeEntry) )
            }
          }

          i ? reader.readEntries(arguments.callee, onError) : dequeue(0)
        }, onError)

        return true
      }
    }

    // Internal method to assign data from a native Entry object.
    self.setNativeEntry = function (item) {
      self.nativeEntry = item && item.webkitGetAsEntry && item.webkitGetAsEntry()
    }

    // Adds event listeners to this object. See DropHandle.event() for
    // extended comment and examples.
    self.event = function (events, funcs) {
      return global.appendEventsToObject.apply(self, arguments)
    }

    // Adds event listeners to this object in front of existing handlers.
    // Can be used to intercept/override certain events. See DropHandle.event()
    // for extended comment and examples.
    self.preview = function (events, funcs) {
      return global.previewToObject.apply(self, arguments)
    }

    /***
      Standard File Event Callbacks
     ***/

    // Takes care of reading binary stream from file and sending it
    // to the remote server using prepared XMLHttpRequest.
    // data is either an ArrayBuffer (Gecko/Chrome) or a native file object
    // (Safari). Either way, send() handles both. This used to deal with
    // sendAsBinary() but it's specific to Firefox 3.6 and is removed now.
    self.onXhrSend = function (xhr, data) {
      xhr.send(data)
    }

    self.event({
      xhrSend:        self.onXhrSend
    })
  }

  // Static method of File that creates an object without attaching to any
  // File API's File object. It's only useful if you have an Entry object
  // that lets you get at least some of the info (e.g. file name) and list
  // contents for DirectoryEntry. See listEntries(). Using sendTo(), readData()
  // and others on such an instance will result in errors.
  //
  //? fromEntry( e.dataTransfer.items[0].webkitGetAsEntry() )
  //      //=> FileDrop.File
  global.File.fromEntry = function (nativeEntry) {
    var file = new global.File(nativeEntry)
    file.setNativeEntry(nativeEntry)
    file.nativeFile = null
    return file
  }

  /***
    FileDrop jQuery Interface
   ***

    After both FileDrop and jQuery (v1 or v2) scripts have loaded call fd.jQuery().
    Don't forget to include/write your FileDrop's CSS as well.

    Once done it becomes possible to access FileDrop as $('#zone').filedrop()
    and avoid accessing its methods and bind event altogether. FileDrop will
    trigger events as if they originated from the DOM node itself and prefix
    each event with either 'fd' (DropHandle/FileDrop classes) or 'file'
    (File class). Arguments remain the same except that:
    * jQuery always passes event object as the first argument so just skip it.
    * File events ('file' prefix) get passed File object as second argument
      (after jQuery event).

    Note that 'this' points to jQuery collection and no more to the FileDrop
    or File instance that has initiated the event.

      $('<div><p>Drop something here...</p></div>')
        .appendTo(document.body)
        .filedrop()
        .on('fdsend', function (e, files) {
          // Occurs when FileDrop's 'send' event is initiated.
          $.each(files, function (i, file) {
            file.sendTo('upload.php')
          })
        })
        .on('filedone', function (e, file) {
          // Occurs when a File object has done uploading.
          alert('Done uploading ' + file.name + ' on ' + this.tagName)
        })

    When constructing FileDrop instance by jQuery in addition to regular 'el'
    property '$el' is set to point to $(el) - zone DOM node as jQuery collection.

    Also, it's still possible to attach listeners to FileDrop object with
    fd.event('event', func) but these events are called after corresponding
    DOM events (added with jQuery). If a DOM event handler returns a non-null
    and non-undefined value - FileDrop's handlers won't be called.

    Event preview handlers ('any' event) can only be attached directly to FileDrop:

      $('#zone')
        .fildrop()
        .filedrop().event('any', function () { ... })

    You can access underlying FileDrop object by calling filedrop() without
    parameters (first such call creates FileDrop, later calls return the
    instance on the first element in the collection):

      $('#zone')            // select <p id="zone">
        .filedrop()         // turn it into a FileDrop zone
        .css({color: red})  // any normal jQuery code
        .filedrop()         // retrieve FileDrop object
        .multiple(true)     // call its method

    Alternatively you can pass a string to filedrop() to select a property
    or call a method - in this case their value/result is returned

      $('#zone')
        .filedrop()
        .filedrop('multiple', true)
          // returns the new state of 'multiple' option, not jQuery object.

    It's also possible to pass custom options to FileDrop constructor:

      $('#zone')
        .filedrop({
          multiple: true,
          iframe: {url: '/upload.php'}
        })
   ***/

  global.jQuery = function ($) {
    $ = $ || jQuery || window.jQuery
    if (!$) { throw 'No window.jQuery object to integrate FileDrop into.' }

    $.fn.filedrop = function (options) {
      function delegate(prefix, firstArgs) {
        return function (event) {
          var args = (firstArgs || []).concat(global.toArray(arguments, 1))
          return $node.triggerHandler((prefix + event).toLowerCase(), args)
        }
      }

      var $node = this
      var host = this.data('filedrop')

      if (typeof options == 'string') {
        if (!host) {
          $.error("$.filedrop('comment') needs an initialized FilrDrop on this element.")
        } else if (typeof host[options] == 'undefined') {
          $.error("There's no method or property FileDrop." + options + ".")
        } else {
          var value = host[options]
          if (typeof value == 'function') {
            return value.apply(host, global.toArray(arguments, 1))
          } else {
            return value
          }
        }
      } else if (!options || typeof options == 'object') {
        if (!host) {
          var zone = new FileDrop(this[0], options)
          zone.$el = $(this)
          this.first().data('filedrop', zone)

          zone.event('any', delegate('fd'))

          zone.on.fileSetup.push(function (file) {
            file.event('any', delegate('file', [file]))
          })
        } else if (!options) {
          return host
        } else {
          global.extend(host.opt, options, true)
        }
      } else {
        $.error('Invalid $.filedrop() parameter - expected nothing (creates new zone),' +
                ' a string (property to access) or an object (custom zone options).')
      }

      return $node
    }
  }

  // Alias window.fd.FileDrop class to just window.FileDrop since it's most used.
  root.FileDrop = global.FileDrop
});
