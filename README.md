# FileDrop - cross-browser JavaScript Drag & Drop file upload

**FileDrop** is a lightweight JavaScript class for easy-to-use file uploading that works out of the box.

[ [Documentation](http://proger.i-forge.net/FileDrop_-_cross-browser_JavaScript_Drag-Drop_file_upload/7CC) | [Demo page](http://proger.i-forge.net/%D0%9C%D0%BE%D0%B8%20%D0%BF%D1%80%D0%BE%D0%B3%D0%B8/%D0%92%D0%B5%D0%B1/FileDrop/demo/index.html) ]

## Features

* Cross-browser – supports Firefox 3.6, Internet Explorer 6, Google Chrome 7, SRWare Iron 4, Apple Safari 5 and Opera 11.61.
* Self-contained & tiny – just 490 lines of code; 8 KiB when minified, 3.5 KiB when gzipped.
* Various callbacks – on progress, on done, on error and on many other events.
* jQuery integration.
* Graceful degradation using IFrame fallback.
* Multiple file selection.
* Any number of independent FileDrops.

## Basic example

[Live demo](http://proger.i-forge.net/%D0%9C%D0%BE%D0%B8%20%D0%BF%D1%80%D0%BE%D0%B3%D0%B8/%D0%92%D0%B5%D0%B1/FileDrop/demo/minimum.html)

```HTML
<!DOCTYPE html>
<html>
  <head>
    <title>Basic FileDrop example</title>

    <script type="text/javascript" src="http://proger.i-forge.net/filedrop-min.js"></script>

    <style type="text/css">
    /* Essential FileDrop element configuration: */
    .fd-zone {
      position: relative;
      overflow: hidden;
      width: 15em;
      text-align: center;
    }

    /* Hides <input type="file" /> while simulating "Browse" button: */
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

    /* Provides visible feedback when user drags a file over the drop zone: */
    .fd-zone.over { border-color: maroon; }
    </style>
  </head>
  <body>
    <!-- A FileDrop area. Can contain any text or elements, or be empty.
         Can be of any HTML tag too, not necessary fieldset. -->
    <fieldset id="zone">
      <legend>Drop a file inside&hellip;</legend>
      <p>Or click here to <em>Browse</em>..</p>
    </fieldset>

    <script type="text/javascript">
      // Tell FileDrop we can deal with iframe uploads using this URL:
      var options = {iframe: {url: 'your-upload-script.php'}};
      // Attach FileDrop to an area:
      var zone = new FileDrop('zone', options);

      // Do something when a user chooses or drops a file:
      zone.on.send.push(function (files) {
        // if browser supports files[] will contain multiple items.
        for (var i = 0; i < files.length; i++) {
          files[i].SendTo('your-upload-script.php');
        }
      });
    </script>
  </body>
</html>
```

## jQuery integration

Drop zone events are prefixed with **fd** while individual file events start with **file**. DOM node events are triggered before those assigned to **obj.on.XXX** arrays and if a node handler returns a non **null** value **on**'s events are skipped.

```JS
  fd.jQuery();  // you can also pass an object like 'jQuery'.

  // Henceforth it's possible to access FileDrop as $().filedrop().
  $('<div><p>Drop something here...</p></div>')
    .appendTo(document.body)
    .filedrop()
    // jQuery always passes event object as the first argument.
    .on('fdsend', function (e, files) {
      $.each(files, function (file) {
        file.SendTo('upload.php');
      });
    })
    .on('filedone', function (e, file) {
      alert('Done uploading ' + file.name + ' on ' + this.tagName);
    });
```
