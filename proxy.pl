#!/usr/local/bin/perl

use HTTP::Proxy qw(:log);
use HTTP::Proxy::BodyFilter::simple;

my $INSERT = <<END;
<script>
(function(d) {
    var iframe = d.body.appendChild(d.createElement('iframe')), doc = iframe.contentWindow.document;
        iframe.src = 'about:blank';
        iframe.style.cssText = "position:absolute;width:1px;height:1px;left:-9999px;";
    doc.open().write('<body onload="YUI_config={win:window.parent,doc:window.parent.document};var d=document;d.getElementsByTagName(\\'head\\')[0].appendChild(d.createElement(\\'script\\')).src=\\'http://ps48174.dreamhostps.com:8081/together\\';"><script src="http://yui.yahooapis.com/combo?3.3.0/build/yui/yui-min.js&3.3.0/build/loader/loader-min.js"><\\/script><\\/body>');
    doc.close();
})(document);
</script>
END

my $hostname = 'ps48174.dreamhostps.com:8081';
my $css = '<link rel="stylesheet" href="http://' . $hostname . '/footer.css" type="text/css" />';

my $CSS = <<END;
    <style>
    html { height: 100%; }
    body {
        height: 100%;
        margin: 0;
        overflow: hidden;
        position: relative;
    }
    #WWWrapper {
        height: 100%;
        margin: 0;
        overflow: scroll;
        width: 100%;
     }
    #CCContent {
        margin-bottom: 40px;
     }
     #FFFooter {
        border-top: 3px solid black;
        background-color: red;
        bottom: 0;
        height: 40px;
        left: 0;
        position: absolute;
        right: 0;
        z-index: 9999;
     }
     .FFForcontent {
        position: absolute;
        overflow: auto;
        top: 0;
        bottom: 0;
        width: 100%;
     }

#footpanel {
    position: fixed;
    bottom: 0; left: 0;
    z-index: 9999; /*--Keeps the panel on top of all other elements--*/
    background: #e3e2e2;
    border: 1px solid #c3c3c3;
    border-bottom: none;
    width: 94%;
    margin: 0 3%;
}

*html #footpanel { /*--IE6 Hack - Fixed Positioning to the Bottom--*/
    margin-top: -1px; /*--prevents IE6 from having an infinity scroll bar - due to 1px border on #footpanel--*/
    position: absolute;
    top:expression(eval(document.compatMode &&document.compatMode=='CSS1Compat') ?documentElement.scrollTop+(documentElement.clientHeight-this.clientHeight) : document.body.scrollTop +(document.body.clientHeight-this.clientHeight));
}

#footpanel ul {
    padding: 0; margin: 0;
    float: left;
    width: 100%;
    list-style: none;
    border-top: 1px solid #fff; /*--Gives the bevel feel on the panel--*/
    font-size: 1.1em;
}
#footpanel ul li{
    padding: 0; margin: 0;
    float: left;
    position: relative;
}
#footpanel ul li a{
    padding: 5px;
    float: left;
    text-indent: -9999px;
    height: 16px; width: 16px;
    text-decoration: none;
    color: #333;
    position: relative;
}
html #footpanel ul li a:hover{  background-color: #fff; }
html #footpanel ul li a.active { /*--Active state when subpanel is open--*/
    background-color: #fff;
    height: 17px;
    margin-top: -2px; /*--Push it up 2px to attach the active button to subpanel--*/
    border: 1px solid #555;
    border-top: none;
    z-index: 200; /*--Keeps the active area on top of the subpanel--*/
    position: relative;
}


#footpanel a.home{  
    background: url(home.png) no-repeat 15px center;
    width: 50px;
    padding-left: 40px;
    border-right: 1px solid #bbb;
    text-indent: 0; /*--Reset text indent--*/
}
a.profile{  background: url(user.png) no-repeat center center;  }
a.contacts{ background: url(address_book.png) no-repeat center center; }
a.playlist{ background: url(document_music_playlist.png) no-repeat center center; }
a.videos{   background: url(film.png) no-repeat center center; }
a.messages{ background: url(mail.png) no-repeat center center; }
a.editprofile{  background: url(wrench_screwdriver.png) no-repeat center center; }
#footpanel a.chat{  
    background: url(balloon.png) no-repeat 15px center;
    width: 126px;
    border-left: 1px solid #bbb;
    border-right: 1px solid #bbb;
    padding-left: 40px;
    text-indent: 0; /*--Reset text indent--*/
}
a.alerts{   background: url(newspaper.png) no-repeat center center;  }

#footpanel li#chatpanel, #footpanel li#alertpanel { float: right; }  /*--Right align the chat and alert panels--*/

#footpanel a small {  /*--panel tool tip styles--*/
    text-align: center;
    width: 70px;
    background: url(pop_arrow.gif) no-repeat center bottom;
    padding: 5px 5px 11px;
    display: none; /*--Hide by default--*/
    color: #fff;
    font-size: 1em;
    text-indent: 0;
}
#footpanel a:hover small{
    display: block; /*--Show on hover--*/
    position: absolute;
    top: -35px; /*--Position tooltip 35px above the list item--*/
    left: 50%; 
    margin-left: -40px; /*--Center the tooltip--*/
    z-index: 9999;
}

#footpanel ul li div a { /*--Reset link style for subpanel links--*/
    text-indent: 0;
    width: auto;
    height: auto;
    padding: 0;
    float: none;
    color: #00629a;
    position: static;
}
#footpanel ul li div a:hover {  text-decoration: underline; } /*--Reset link style for subpanel links--*/

#footpanel .subpanel {
    position: absolute;
    left: 0; bottom: 27px;
    display: none;  /*--Hide by default--*/
    width: 198px;
    border: 1px solid #555;
    background: #fff;
    overflow: hidden;
    padding-bottom: 2px;
}
#footpanel h3 {
    background: #526ea6;
    padding: 5px 10px;
    color: #fff;
    font-size: 1.1em;
    cursor: pointer;
}
#footpanel h3 span { 
    font-size: 1.5em;
    float: right;
    line-height: 0.6em; 
    font-weight: normal;
}
#footpanel .subpanel ul{
    padding: 0; margin: 0;
    background: #fff;
    width: 100%;
    overflow: auto;
}
#footpanel .subpanel li{ 
    float: none; /*--Reset float--*/
    display: block;
    padding: 0; margin: 0;
    overflow: hidden;
    clear: both;
    background: #fff;
    position: static;  /*--Reset relative positioning--*/
    font-size: 0.9em;
}

#chatpanel .subpanel li { background: url(dash.gif) repeat-x left center; } 
#chatpanel .subpanel li span {
    padding: 5px;
    background: #fff;
    color: #777;
    float: left;
}
#chatpanel .subpanel li a img {
    float: left;
    margin: 0 5px;
}
#chatpanel .subpanel li a{
    padding: 3px 0; margin: 0;
    line-height: 22px;
    height: 22px;
    background: #fff;
    display: block;
}
#chatpanel .subpanel li a:hover {
    background: #3b5998;
    color: #fff;
    text-decoration: none;
}


#alertpanel .subpanel { right: 0; left: auto; /*--Reset left positioning and make it right positioned--*/ }
#alertpanel .subpanel li {
    border-top: 1px solid #f0f0f0;
    display: block;
}
#alertpanel .subpanel li p {padding: 5px 10px;}
#alertpanel .subpanel li a.delete{
    background: url(delete_x.gif) no-repeat;
    float: right;
    width: 13px; height: 14px;
    margin: 5px;
    text-indent: -9999px;
    visibility: hidden; /*--Hides by default but still takes up space (not completely gone like display:none;)--*/
}
#alertpanel .subpanel li a.delete:hover { background-position: left bottom; }
#footpanel #alertpanel li.view {
    text-align: right;
    padding: 5px 10px 5px 0;
}
    </style>
END

# init
my $proxy = HTTP::Proxy->new( port => 8080, host => '', max_clients => 100 );
$proxy->push_filter(
    mime     => 'text/html',
    response => HTTP::Proxy::BodyFilter::simple->new(
        sub {
            ${ $_[1] } =~ s!<head(.*?)>!<head$1>$css!i;
            ${ $_[1] } =~ s!<body(.*?)>!<body$1><div id="WWWrapper"><div id="CCContent">!i;
            ${ $_[1] } =~ s!</body>!</div></div>$INSERT</body>!i; 
        }
    )
);

print "Ready to rumble on " . $proxy->host . ':' . $proxy->port . "\n";
$proxy->start;
