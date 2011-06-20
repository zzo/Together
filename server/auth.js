var urlparser = require('url'),
    fs = require('fs'),
    qs = require('querystring');

var authCheck = function(rclient, hostname) {
    return function(req, res, next) {
        var url = req.urlp = urlparser.parse(req.url, true);

        console.log('AUTH');
        console.log(url.pathname);

        // Auth callback
        if (url.pathname.match(/^\/auth\//)) {
            console.log('Auth CALLBACK continuing...');
            next();
            return;
        } else if (url.pathname == "/logout" ) {
            req.session.destroy();
            res.end('see ya later!');
            return;
        } else if (url.pathname == '/amiloggedin') {
            if (req.session && req.session.user) {
                // yep
                res.writeHead(204);
            } else {
                // nope
                res.writeHead(403);
            }
            res.end();
            return;
        } else if (req.session && req.session.user || (url.pathname == '/together')) {
            next(); // stop here and pass to the next onion ring of connect
            return;
        } else if (url.pathname == '/login' || url.pathname == '/ajax-login') {
            var d = '';
            req.on('data', function(chunk) {
                d += chunk;
            });
            req.on('end', function() {
                var obj = qs.parse(d);
                rclient.hgetall(obj.user, function(error, user_obj) {
                    if (user_obj && user_obj.password === obj.password) {
                        req.session.user = obj.user;
                        res.end(JSON.stringify({ success: true }));
                    } else {
                        res.end(JSON.stringify({ success: false, errors: { user: 'Username incorrect', password: 'Password incorrect' } }));
                    }
                    return;
                });
            });
        } else if (url.pathname == '/ajax-register') {
            var d = '';
            req.on('data', function(chunk) {
                d += chunk;
            });
            req.on('end', function() {
                var obj = qs.parse(d);
                rclient.keys(obj.user, function(error, key) {
                    if (key.length) {
                        res.end(JSON.stringify({ success: false, errors: { user: 'Username already exists' } }));
                    } else {
                        rclient.hset(obj.user, 'password', obj.password);
                        res.end(JSON.stringify({ success: true }));
                    }
                    return;
                });
            });
       /* } else if (url.pathname !== '/start/login.html' && (!req.session || !req.session.user)) {
            console.log(url.pathname);
            res.writeHead(200, { 'Content-type': 'application/javascript' });
            res.end('top.location.href="http://' + hostname + '/start/login.html";');
            return;
        }*/ 
        } else if (url.pathname == '/together') {
            res.end('top.location.href="http://' + hostname + '/start/login.html";', 'utf8');
        } else {
            console.log('FAIL: ' + url.pathname);
            console.log(url);
            fail('ya gotta log in...');
        }

        function fail(msg) {
            // ####
            // User needs to log in...
            res.writeHead(403);
            var login_page = fs.createReadStream('../static/start/login.html');
            login_page.resume();
            login_page.pipe(res, { end: false });
            res.end(msg || '');
            return;
        }
    };
}

exports.authCheck = authCheck;
