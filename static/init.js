/*jslint plusplus: false */
var SERVER     = 'ps48174.dreamhostps.com',
    PORT       = 8081;

YUI({ filter: '' }).use('yui', function (Y) {

    var pipeline = YUI({
        win: window,
        doc: document
    });

    Y.Get.script = function() {
        return pipeline.Get.script.apply(pipeline, arguments);
    };

    Y.use('node', function(Y) {

        var keepAliveTimer, Y.Global.Env.FB_USER_ID = FB_USER_ID,
            script = Y.config.doc.createElement('script');

        script.type = 'text/javascript';
        script.src  = 'http://' + SERVER + ':' + PORT + '/socket.io/socket.io.js';
        Y.config.doc.getElementsByTagName('head')[0].appendChild(script);

        Y.on("domready", function() {
            if (Y.config.win.top == Y.config.win.self) {
                Y.Global.fire('top_dom');
            }
        });

        Y.on('socketHere', function(socket) {
            Y.Global.Env.SOCKET = socket;

            socket.on('message', function(message) {
                Y.Global.fire(message.event, message);
            });

            if (Y.config.win.top == Y.config.win.self) {
                Y.Global.fire('top_socket', socket);
            }
        });

        // Deal with UI
        Y.on('top_socket', function(socket) {
            // Send alive messages
            var LOOP = 10;  // check in every X seconds
            var f = Y.Gobal.fire;

            // Only send keepAlives for very top window
            f('sendMessage', { event: 'iamHere', uid: Y.Global.Env.FB_USER_ID, href: Y.config.win.location.href, title: Y.config.doc.title}); 
            keepAliveTimer = Y.later(LOOP * 1000, this, 
                function() { 
                    f('sendMessage', { event: 'iamHere', uid: Y.Global.Env.FB_USER_ID, href: Y.config.win.location.href, title: Y.config.doc.title});
                }, {}, true
            );
        });
    });

    // Wait for socket.io to show up
    (function getSocket() {
        var timer, socket;
        function checkForSocket() {
            if (typeof(Y.config.win.io) === 'object') {
                timer.cancel();
                socket = new Y.config.win.io.Socket(SERVER, { port: PORT });
                socket.connect();
                Y.fire('socketHere', socket);
            }
        }
            // bah not here yet - wait around I guess
        timer = Y.later(100, Y, checkForSocket, [], true);
    })();

    Y.Global.on('sendMessage', function(message) {
        Y.Global.Env.SOCKET.send(message);
    });

    function createSandbox(node, css, modules) {
         var iframe = Y.Node.create('<iframe style="background: red;" width="90%" height="90%"  border="0" frameBorder="0" marginWidth="0" marginHeight="0" leftMargin="0" topMargin="0" allowTransparency="true" title="Online Friends">Online Friends</iframe>'),
             DEFAULT_CSS = css; //'http://yui.yahooapis.com/combo?3.3.0/build/cssreset/reset-min.css&3.3.0/build/cssfonts/fonts-min.css&3.3.0/build/widget/assets/skins/sam/widget.css&3.3.0/build/datatable/assets/skins/sam/datatable-base.css',
             BODY= '<body class="yui3-skin-sam"><br></body>',
             META = '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>',
             STYLE = 'html{overflow:hidden;border:0;margin:0;padding:0;}',
             html = '<!doctype html><html><head>' + META + '<link rel="stylesheet" type="text/css" href="' + DEFAULT_CSS + '"><style>' + STYLE + '</style></head>' + BODY + '</html>',
             doc;
 
        iframe.set('src', 'javascript' + ((Y.UA.ie) ? ':false' : ':') + ';');

        // injecting the structure into the node wrapper
        node.append( iframe );
         // setting the content of the iframe
        doc = iframe._node.contentWindow.document;
        doc.open().write(html);
        doc.close();

        var sub_yui = YUI({
            win: iframe._node.contentWindow,
            doc: iframe._node.contentWindow.document,
            modules: modules
        });

        // Pipeline to iframe
        sub_yui.use('yui', function (UI) {  
            sub_yui.Get.script = function() {
                return pipeline.Get.script.apply(pipeline, arguments);
            };
        })

        //iframe._node.contentWindow.YUI = sub_yui;
        return sub_yui;
     }

    var modules = [ 
        { id: 'eventing', file: 'eventing.js', requires: ['node', 'recordset-base', 'datatable', 'recordset-indexer' ], class: 'Eventing' },
        { id: 'footpanel', file: 'footPanel.js', requires: ['node', 'recordset-base', 'datatable', 'recordset-indexer' ], class: 'FootPanel' },
        { id: 'friendTable', file: 'userTable.js', requires: ['node', 'recordset-base', 'datatable', 'recordset-indexer' ], class: 'FriendTable',
            css: 'http://yui.yahooapis.com/combo?3.3.0/build/cssreset/reset-min.css&3.3.0/build/cssfonts/fonts-min.css&3.3.0/build/widget/assets/skins/sam/widget.css&3.3.0/build/datatable/assets/skins/sam/datatable-base.css'
        }
    ];

   // load up modules
    Y.Global.on('top_dom', function() {
        modules.forEach(function(module) {
            var hash = {};
            hash[module.id] = { 
                fullpath: 'http://' + SERVER + ':' + PORT + '/' + module.file,
                requires: module.requires
            }

            if (module.css) {
                Y.one('body').append('<div id="' + module.id + '"></div>');
                var sub_yui = createSandbox(Y.one('#' + module.id), module.css, hash);
                sub_yui.use(module.id, function(Y) {
                    new Y[module.class]();
                });
            } else {
                new Y[module.class]();
            }
        });
    });
});
