/*jslint plusplus: false */
var SERVER     = 'ps48174.dreamhostps.com',
    PORT       = 8081,
    yconfig = { 
//        gallery: 'gallery-2011.03.11-23-49',
        modules: {
            togetherLoader: { fullpath: 'http://' + SERVER + ':' + PORT + '/start/loader.js' },
//            togetherNotify: { fullpath: 'http://' + SERVER + ':' + PORT + '/ui/notify.js', requires: [ 'event-custom-base', 'gallery-notify', 'gallery-dialog', 'gallery-button' ] },
            baseTable: { fullpath: 'http://' + SERVER + ':' + PORT + '/ui/baseTable.js', requires: [ 'node', 'recordset-base', 'datatable', 'recordset-indexer', 'event-custom-base' ] }
        }
    };

YUI(yconfig).use('yui', function(Y) {
    if (Y.config.win.top == Y.config.win.self) {
        var pipeline = YUI({
            win: window,
            doc: document
        });

        // JS pipeline into initial iframe
        Y.Get.script = function() {
            return pipeline.Get.script.apply(pipeline, arguments);
        };

        Y.use('node', function(Y) {

           if ('jQuery' in Y.config.win) {
                if (!Y.config.win.jQuery) {
                    delete Y.config.win.jQuery;
                }
           }
            var script = Y.config.doc.createElement('script');
            script.type = 'text/javascript';
            script.src  = 'http://' + SERVER + ':' + PORT + '/socket.io/socket.io.js';
            Y.config.doc.getElementsByTagName('head')[0].appendChild(script);

            Y.on('socketHere', function(socket) {
                Y.Global.on('sendMessage', function(message) {
                    message.uid = USER_ID;
                    socket.send(message);
                });

                socket.on('message', function(message) {
                    Y.Global.fire(message.event, message);
                });

                Y.use('togetherLoader', 'baseTable', function(Y) {
                    Y.on("domready", function() {
                        new Y.TogetherLoader({ pipeline: pipeline, server: SERVER, port: PORT });
                    });
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
                        socket.on('connect', function() {
                            Y.fire('socketHere', socket);
                        });
                    }
                }
                    // bah not here yet - wait around I guess
                timer = Y.later(100, Y, checkForSocket, [], true);
            })();
        });
    }
});
