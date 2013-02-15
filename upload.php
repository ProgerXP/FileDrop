<?php
/*!
  FileDrop JavaScript classes | by Proger_XP | In public domain
  http://proger.i-forge.net/FileDrop/7CC

 ***

  This is an example of server-side script that handles both AJAX and IFrame uploads.

  AJAX upload provides raw file data as POST input while IFrame is a POST request
  with $_FILES member set.

  Result is either output as HTML with JavaScript code to invoke the callback
  (like JSONP) or in plain text if none is given (it's usually absent on AJAX).
*/

$charset = '; charset=utf-8';
$callback = &$_REQUEST['fd-callback'];

if (!empty($_FILES['fd-file']) and is_uploaded_file($_FILES['fd-file']['tmp_name'])) {
  $name = $_FILES['fd-file']['name'];
  $data = file_get_contents($_FILES['fd-file']['tmp_name']);

  $accept = &$_SERVER['HTTP_ACCEPT_CHARSET'];
  $accept and $charset = '; charset='.strtok(strtok($accept, ';'), ',');
} else {
  $name = urldecode(@$_SERVER['HTTP_X_FILE_NAME']);
  $data = file_get_contents("php://input");
}

$output = sprintf('%s; received %s bytes, CRC32 = %08X, MD5 = %s', $name,
                  number_format(strlen($data)), crc32($data), strtoupper(md5($data)));

$opt = &$_REQUEST['upload_option'];
isset($opt) and $output .= "\nReceived upload_option with value $opt";

if ($callback) {
  header('Content-Type: text/html'.$charset);

  $output = addcslashes($output, "\\\"\0..\x1F");
  echo '<!DOCTYPE html><html><head></head><body><script type="text/javascript">',
       "try{window.top.$callback(\"$output\")}catch(e){}</script></body></html>";
} else {
  header('Content-Type: text/plain'.$charset);
  echo $output;
}
