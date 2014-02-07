<?php
/*!
  FileDrop Revamped - server-side upload handler sample
  in public domain  | http://filedropjs.org

 ***

  This is an example of server-side script that handles both AJAX and IFrame uploads.

  AJAX upload provides raw file data as POST input while IFrame is a POST request
  with $_FILES member set.

  Result is either output as HTML with JavaScript code to invoke the callback
  (like JSONP) or in plain text if none is given (it's usually absent on AJAX).
*/

// If an error causes output to be generated before headers are sent - catch it.
ob_start();

// Callback name is passed if upload happens via iframe, not AJAX (FileAPI).
$callback = &$_REQUEST['fd-callback'];

// Upload data can be POST'ed as raw form data or uploaded via <iframe> and <form>
// using regular multipart/form-data enctype (which is handled by PHP $_FILES).
if (!empty($_FILES['fd-file']) and is_uploaded_file($_FILES['fd-file']['tmp_name'])) {
  // Regular multipart/form-data upload.
  $name = $_FILES['fd-file']['name'];
  $data = file_get_contents($_FILES['fd-file']['tmp_name']);
} else {
  // Raw POST data.
  $name = urldecode(@$_SERVER['HTTP_X_FILE_NAME']);
  $data = file_get_contents("php://input");
}

// Output message for this demo upload. In your real app this would be something
// meaningful for the calling script (that uses FileDrop.js).
$output = sprintf('%s; received %s bytes, CRC32 = %08X, MD5 = %s', $name,
                  number_format(strlen($data)), crc32($data), strtoupper(md5($data)));

// In FileDrop sample this demonstrates the passing of custom ?query variables along
// with an AJAX/iframe upload.
$opt = &$_REQUEST['upload_option'];
isset($opt) and $output .= "\nReceived upload_option with value $opt";

if ($callback) {
  // Callback function given - the caller loads response into a hidden <iframe> so
  // it expects it to be a valid HTML calling this callback function.
  header('Content-Type: text/html; charset=utf-8');

  // Escape output so it remains valid when inserted into a JS 'string'.
  $output = addcslashes($output, "\\\"\0..\x1F");

  // Finally output the HTML with an embedded JavaScript to call the function giving
  // it our message(in your app it doesn't have to be a string) as the first parameter.
  echo '<!DOCTYPE html><html><head></head><body><script type="text/javascript">',
       "try{window.top.$callback(\"$output\")}catch(e){}</script></body></html>";
} else {
  // Caller reads data with XMLHttpRequest so we can output it raw. Real apps would
  // usually pass and read a JSON object instead of plan text.
  header('Content-Type: text/plain; charset=utf-8');
  echo $output;
}
