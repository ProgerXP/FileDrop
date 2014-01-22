# FileDrop Revamped
#### Self-contained cross-browser HTML5, legacy, AJAX, drag & drop JavaScript file upload

**FileDrop** is a lightweight JavaScript class for easy-to-use file uploading that works out of the box and supports even most legacy browsers.

[ [Documentation](http://filedropjs.org) | [Demo page](http://filedropjs.org/demo/) ]

## Features

* **Cross-browser** – supports Firefox 3.6, Internet Explorer 6, Google Chrome 7, Apple Safari 5 and Opera 11.61.
* **No JS dependencies**, Flash or Java applets
* 900 lines of code, 1300 lines of comments
* **16 KiB minified**, 6 KiB gzipped
* **HTML5, drag &amp; drop** for modern browsers
* **IFrame fallback** for legacy agents (IE 6+)
* Flexible **event system** with over 15 callbacks
* Multiple **independent FileDrops** on one page
* Ready for **jQuery**, PHP, ASP.net and others
* 500+ lines of **unit tests** ([tests.html](http://filedropjs.org/demo/tests.html))

## Basic example

[Live demo](http://filedropjs.org/demo/basic.html) →

```HTML
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Basic FileDrop example</title>

    <script type="text/javascript" src="../filedrop.js"></script>
    <script type="text/javascript" src="filedrop.js"></script>

    <style type="text/css">
    /***
      Styles below are only required if you're using <iframe> fallback in
      addition to HTML5 drag & drop (only working in Firefox/Chrome).
     ***/

    /* Essential FileDrop zone element configuration: */
    .fd-zone {
      position: relative;
      overflow: hidden;
      /* The following are not required but create a pretty box: */
      width: 15em;
      margin: 0 auto;
      text-align: center;
    }

    /* Hides <input type="file"> while simulating "Browse" button: */
    .fd-file {
      opacity: 0;
      font-size: 118px;
      position: absolute;
      right: 0;
      top: 0;
      z-index: 1;
      padding: 0;
      margin: 0;
      cursor: pointer;
      filter: alpha(opacity=0);
      font-family: sans-serif;
    }

    /* Provides visible feedback when use drags a file over the drop zone: */
    .fd-zone.over { border-color: maroon; background: #eee; }
    </style>
  </head>
  <body>
    <noscript style="color: maroon">
      <h2>JavaScript is disabled in your browser. How do you expect FileDrop to work?</h2>
    </noscript>

    <h2 style="text-align: center">
      <a href="http://filedropjs.org">FileDrop</a> basic sample
    </h2>

    <!-- A FileDrop area. Can contain any text or elements, or be empty.
         Can be of any HTML tag too, not necessary fieldset. -->
    <fieldset id="zone">
      <legend>Drop a file inside&hellip;</legend>
      <p>Or click here to <em>Browse</em>..</p>

      <!-- Putting another element on top of file input so it overlays it
           and user can interact with it freely. -->
      <p style="z-index: 10; position: relative">
        <input type="checkbox" id="multiple">
        <label for="multiple">Allow multiple selection</label>
      </p>
    </fieldset>

    <script type="text/javascript">
      // Tell FileDrop we can deal with iframe uploads using this URL:
      var options = {iframe: {url: 'upload.php'}};
      // Attach FileDrop to an area ('zone' is an ID but you can also give a DOM node):
      var zone = new FileDrop('zone', options);

      // Do something when a user chooses or drops a file:
      zone.event('send', function (files) {
        // Depending on browser support files (FileList) might contain multiple items.
        files.each(function (file) {
          // React on successful AJAX upload:
          file.event('done', function (xhr) {
            // 'this' here points to fd.File instance that has triggered the event.
            alert('Done uploading ' + this.name + ', response:\n\n' + xhr.responseText);
          });

          // Send the file:
          file.sendTo('upload.php');
        });
      });

      // React on successful iframe fallback upload (this is separate mechanism
      // from proper AJAX upload hence another handler):
      zone.event('iframeDone', function (xhr) {
        alert('Done uploading via <iframe>, response:\n\n' + xhr.responseText);
      });

      // A bit of sugar - toggling multiple selection:
      fd.addEvent(fd.byID('multiple'), 'change', function (e) {
        zone.multiple(e.currentTarget || e.srcElement.checked);
      });
    </script>
  </body>
</html>
```

## jQuery integration

 FileDrop can be integrated with jQuery by simply calling the following method (once, after loading both FileDrop and jQuery): `fd.jQuery()`.

Drop zone events are prefixed with **fd** while individual file events start with **file**. DOM node events are triggered before those assigned to `obj.on.XXX` arrays and if a node handler returns non-null value on’s events are skipped.

Note that jQuery will prepend its own event object in front of FileDrop’s normal event arguments since they’re triggered as regular events of a DOM node. See extensive comments in the sources for more details and examples.

More information in the [documentation](http://filedropjs.org/#jquery) →

```JS
fd.jQuery();  // you can also pass an object like 'jQuery'.

// Henceforth it's possible to access FileDrop as $().filedrop().
$('<div><p>Drop something here...</p></div>')
  .appendTo(document.body)
  .filedrop()
  // jQuery always passes event object as the first argument.
  .on('fdsend', function (e, files) {
    $.each(files, function (i, file) {
      file.SendTo('upload.php');
    });
  })
  .on('filedone', function (e, file) {
    alert('Done uploading ' + file.name + ' on ' + this.tagName);
  });
```
