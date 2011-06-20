#!/usr/local/bin/perl

use HTTP::Proxy qw(:log);
use HTTP::Proxy::BodyFilter::simple;
use HTTP::Proxy::BodyFilter::complete;
use HTTP::Proxy::HeaderFilter::simple;
use Compress::Zlib;
use Data::Dumper;
use URI;

my $contentEncoding;
my $hostname = 'dashr.net';
my $port = 8081;

my $INSERT = <<END;
<script>
(function(d) {
    var iframe = d.body.appendChild(d.createElement('iframe')), doc = iframe.contentWindow.document;
        iframe.src = 'about:blank';
        iframe.style.cssText = "position:absolute;width:1px;height:1px;left:-9999px;";
    doc.open().write('<body onload="YUI_config={filter:\\'\\',win:window.parent,doc:window.parent.document};var d=document;d.getElementsByTagName(\\'head\\')[0].appendChild(d.createElement(\\'script\\')).src=\\'http://dashr.net:8081/together\\';"><script src="http://yui.yahooapis.com/combo?3.3.0/build/yui/yui-min.js&3.3.0/build/loader/loader-min.js"><\\/script><\\/body>');
    doc.close();
})(document);
</script>
END

my @css_files = qw(growl dialog button);
my $css;
foreach my $css_file (@css_files) {
    $css .= '<link rel="stylesheet" href="http://' . $hostname . ':' . $port . '/' . $css_file . '.css" type="text/css" />';
}

my $gzip        = Compress::Zlib::memGzip($INSERT);
my $gzip_css    = Compress::Zlib::memGzip($css);
# init
my $proxy = HTTP::Proxy->new( port => 8080, host => '', max_clients => 100 );
$proxy->push_filter(
    response => HTTP::Proxy::BodyFilter::complete->new,
    response => HTTP::Proxy::BodyFilter::simple->new(
        sub {
            my ( $self, $dataref, $message, $protocol, $buffer ) = @_;
            my $request = $self->proxy()->request;
            my $response = $message;
            $uri = URI->new($request->uri);
            my $req_host = $uri->host;
            return if ($req_host eq 'toolbar.yahoo.com');
#            return unless ($req_host =~ m#yahoo\.(com|net)$#);
            return if ($req_host =~ /$hostname/);
            return unless ($response);
            my $ct = $response->header('content-type');

            if ($ct =~ m#text/html#i && $$dataref) {
#                if ($contentEncoding eq 'gzip') {
                if ($response->header('content-type') =~ m#text/html#i &&  $response->header('content-encoding') =~ /gzip/) {
                    $dest = Compress::Zlib::memGunzip($$dataref) or die "Cannot uncompress: $gzerrno\n";
                    $dest =~ s#</head>#$css</head>#i;
                    $dest .= $INSERT;
                    $$dataref = Compress::Zlib::memGzip($dest) or die "Cannot uncompress: $gzerrno\n";
                } else {
                    $$dataref =~ s#</head>#$css</head>#i;
                    $$dataref .= $INSERT;
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
#$proxy->push_filter( response => $filter );

print "Ready to rumble on " . $proxy->host . ':' . $proxy->port . "\n";
$proxy->start;
