<?php
$charset = '; charset=utf-8';
$callback = &$_REQUEST['fd-callback'];

if (!empty($_FILES['fd-file']) and is_uploaded_file($_FILES['fd-file']['tmp_name'])) {
  $name = $_FILES['fd-file']['name'];
  $data = file_get_contents($_FILES['fd-file']['tmp_name']);

  $accept = &$_SERVER['HTTP_ACCEPT_CHARSET'];
  $accept and $charset = '; charset='.strtok(strtok($accept, ';'), ',');
} else {
  $name = urldecode($_SERVER['HTTP_X_FILE_NAME']);
  $data = file_get_contents("php://input");
}

$output = sprintf('%s; received %d bytes, CRC32 = %08X, MD5 = %s', $name,
                  strlen($data), crc32($data), strtoupper(md5($data)));

if ($callback) {
  header('Content-Type: text/html'.$charset);

  $output = addcslashes($output, "\\\"\0..\x1F");
  echo '<!DOCTYPE html><html><head></head><body><script type="text/javascript">',
       "try { window.top.$callback(\"$output\"); } catch (e) { }</script></body></html>";
} else {
  header('Content-Type: text/plain'.$charset);
  echo $output;
}
