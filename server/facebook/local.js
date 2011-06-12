var urlparser   = require('url'),
    https       = require('https'),
    http        = require('http'),
    net         = require('net'),
    qs          = require('querystring'),
    auth        = require('connect-auth'),
    OAuth       = require('oauth').OAuth;

var facebook = function(args) {
    return function(req, res, next) {
        var url = req.urlp = urlparser.parse(req.url, true);

        if (url.pathname == "/auth/facebook" ) {
            req.authenticate(['facebook'], function(error, authenticated) {
                if( authenticated ) {
                    args.rclient.hset(req.session.user, 'facebook.access_token', req.session.access_token);
                    res.end("<html><h1>Hello Facebook user:" + JSON.stringify( req.getAuthDetails().user ) + ".</h1></html>")
                }
                else {
                    res.end("<html><h1>Facebook authentication failed :( </h1></html>")
                }
            });
        } else if (url.pathname == "/facebook" ) {
          res.end('<html>\
              <head>                                             \n\
                <title>Link With Facebook</title> \n\
<script src="http://connect.facebook.net/en_US/all.js"></script>\
              </head>                                            \n\
              <body>                                             \n\
              <div id="fb-root"></div>\
                  <a href="https://www.facebook.com/dialog/oauth?client_id=166824393371670&redirect_uri=http://dashr.net:8081/auth/facebook&scope=xmpp_login,email">CLICK</a> \
                <div id="wrapper">                               \n\
                  <h1>Not authenticated</h1>                     \n\
                  <div class="fb_button" id="fb-login" style="float:left; background-position: left -188px">          \n\
                    <a href="/auth/facebook" class="fb_button_medium">        \n\
                      <span id="fb_login_text" class="fb_button_text"> \n\
                        Connect with Facebook                    \n\
                      </span>                                    \n\
                    </a>                                         \n\
                  </div>                                         \n\
                </div>                                           \n\
                <script>\
  FB.init({ appId  : "166824393371670", status: true });\
                FB.getLoginStatus(function(response) {\
                    console.log("RESP: ");console.log(response); });\
            </script>\
              </body>                                            \n\
            </html>');
        } else if (url.pathname == '/fbchat') {
            // proxy these connections to localhost:5280
            req.on('data', function(chunk) {
                var options = {
                    host: 'localhost',
                    port: 5280,
                    path: '/http-bind/',
                    method: 'POST'
                },
                fb_req = http.request(options, function(fb_res) {
                    fb_res.on('data', function(fb_data) {
                        res.end(fb_data.toString());
                    });
                });

                fb_req.end(chunk.toString());
            });

        } else {
            next();
        }
    };
};

exports.local_facebook = facebook;
