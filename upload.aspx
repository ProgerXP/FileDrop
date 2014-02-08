<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="Upload.aspx.cs" Inherits="FileDropAspNetScript.Upload" %>
<%@ Import Namespace="System.Security.Cryptography" %>

<script runat="server">
    public string BytesArrayToHexString(byte[] hash)
    {
        var sb = new StringBuilder();
        for (int i = 0; i < hash.Length; i++)
        {
            sb.Append(hash[i].ToString("X2"));
        }
        return sb.ToString();
    }
</script>

<%
/*!
    FileDrop Revamped - server-side upload handler sample
    in public domain  | http://filedropjs.org

    ***

    This is an example of server-side script that handles both AJAX and IFrame uploads.

    AJAX upload provides raw file data as POST input while IFrame is a POST request
    with Request.Files member set.

    Result is either output as HTML with JavaScript code to invoke the callback
    (like JSONP) or in plain text if none is given (it's usually absent on AJAX).
*/

// Callback name is passed if upload happens via iframe, not AJAX (FileAPI).
string callback = Request.Form["fd-callback"];
string name;
byte[] data;

// Upload data can be POST'ed as raw form data or uploaded via <iframe> and <form>
// using regular multipart/form-data enctype (which is handled by ASP.NET Request.Files).
HttpPostedFile fdFile = Request.Files["fd-file"];
if (fdFile != null) {
    // Regular multipart/form-data upload.
    name = fdFile.FileName;
    data = new byte[fdFile.ContentLength];
    fdFile.InputStream.Read(data, 0, fdFile.ContentLength);
} else {
    // Raw POST data.
    name = HttpUtility.UrlDecode(Request.Headers["X-File-Name"]);
    data = new byte[Request.InputStream.Length];
    Request.InputStream.Read(data, 0, (int) Request.InputStream.Length); //up to 2GB
}

// Output message for this demo upload. In your real app this would be something
// meaningful for the calling script (that uses FileDrop.js).
byte[] md5Hash;
using (MD5 md5 = MD5.Create())
{
    md5Hash = md5.ComputeHash(data);
}
string output = string.Format("{0}; received {1} bytes, MD5 = {2}", name, data.Length, BytesArrayToHexString(md5Hash));

// In FileDrop sample this demonstrates the passing of custom ?query variables along
// with an AJAX/iframe upload.
string opt = Request["upload_option"];
if (! string.IsNullOrEmpty(opt))
{
    output += "\nReceived upload_option with value " + opt;
}

if (! string.IsNullOrEmpty(callback))
{
    // Callback function given - the caller loads response into a hidden <iframe> so
    // it expects it to be a valid HTML calling this callback function.
    Response.Headers["Content-Type"] = "text/html; charset=utf-8";
    output = HttpUtility.JavaScriptStringEncode(output);

    Response.Write(
        "<!DOCTYPE html><html><head></head><body><script type=\"text/javascript\">" +
       "try{window.top." + callback + "(\"" + output + "\")}catch(e){}</script></body></html>");
}
else
{
    Response.Headers["Content-Type"] = "text/plain; charset=utf-8";
    Response.Write(output);
}

%>