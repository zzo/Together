YUI().add('keepAlive', function(Y) {
    // Deal with UI
    // Send alive messages
    var LOOP = 10;  // check in every X seconds

    // Only send keepAlives for very top window
    Y.Global.fire('sendMessage', { event: 'iamHere', href: Y.config.win.location.href, title: top.document.title }); 
        Y.later(LOOP * 1000, this,
        function() {
            Y.Global.fire('sendMessage', { event: 'iamHere', href: Y.config.win.location.href, title: top.document.title });
        }, {}, true
    );
}, '1.0', { requires: [ 'event-custom-base' ] } );

