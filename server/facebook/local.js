var urlparser   = require('url'),
    https       = require('https'),
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
                <script src="http://static.ak.fbcdn.net/connect/en_US/core.js"></script> \n\
              </head>                                            \n\
              <body>                                             \n\
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
              </body>                                            \n\
            </html>');
        } else {
            next();
        }
    };
};

exports.local_facebook = facebook;
