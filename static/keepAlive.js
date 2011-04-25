YUI().add('keepAlive', function(Y) {
    // Deal with UI
    Y.Global.on('top_socket', function(socket) {
        // Send alive messages
        var LOOP = 10;  // check in every X seconds
        var f = Y.Gobal.fire;
    
    // Only send keepAlives for very top window
        f('sendMessage', { event: 'iamHere', href: Y.config.win.location.href, title: Y.config.doc.title }); 
        keepAliveTimer = Y.later(LOOP * 1000, this,
            function() {
                f('sendMessage', { event: 'iamHere', href: Y.config.win.location.href, title: Y.config.doc.title });
            }, {}, true
        );
    });
});


