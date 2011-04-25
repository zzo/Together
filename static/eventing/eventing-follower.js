YUI().add('eventing-follower', function(Y) {
    var body = Y.one('body'), TRACKER_QUEUE, TRACKER_CURSOR;

    Y.on('window:resize', sizeShim);
    function sizeShim() {
        var h = body.get('docHeight'), w = body.get('docWidth'), shim = Y.one('#TRACKER_SHIM');
        shim.setStyles({
            height: h + 'px',
            width: w + 'px'
        });
    }

    function stopFollow() {
        Y.one('#TRACKER_SHIM').setStyle('display', 'none');
    }

    function startFollow() {
        if (!Y.one('#TRACKER_SHIM')) {
            shim = Y.Node.create('<div id="TRACKER_SHIM"><img style="opacity: 1; z-index: 9999; position: absolute" id="TRACKER_CURSOR" src="http://' + SERVER + ':' + PORT + '/pointer_cursor.png"></img></div>');

            // IE < 9 doesn't like 'transparent' shim bg color...
            //  'red' is just a dummy since opacity is 0
            bcolor = 'transparent';
            if (Y.UA.ie > 0 && Y.UA.ie < 9) {
                bcolor = 'red';
            }

            shim.setStyles({
                opacity:         '1',
                filter:         'alpha(opacity=0)',                  // second!
                position:        'absolute',
                zIndex:          '999',
                overflow:        'hidden',
                backgroundColor: bcolor,
                display:         'none',
                height:          '5px',
                width:           '5px',
                top:             '0px',
                left:            '0px',
                borderWidth:     '0 0 0 2px !important'
            });
            body.append(shim);
            TRACKER_CURSOR = Y.one('#TRACKER_CURSOR');
        }

        if (!TRACKER_QUEUE) {
            TRACKER_QUEUE = new Y.AsyncQueue();
//            TRACKER_QUEUE.on('complete', stopFollow);
        } else {
            TRACKER_QUEUE.stop();
        }

        sizeShim();
        shim.setStyle('display', 'block');
    }

    function doEvent(event) {
        var val, target;

        try {
            if (event.target === 'window' || target === 'document') {
                event.target = 'body';
            }

            target = Y.Node.one(event.target);

            if (!target) {
                Y.log('Cannot find target: ' + event.target);
                return;
            }

            event.target = target;

            if (Y.Array.indexOf(TRACKER_EVENTS, event.type) >= 0) {
                if (event.relatedTarget) {
                    event.relatedTarget = Y.Node.getDOMNode(Y.Node.one(event.relatedTarget));
                } else {
                    event.relatedTarget = null;
                }
                if (event.originalTarget) {
                    event.originalTarget = Y.Node.getDOMNode(Y.Node.one(event.originalTarget));
                } else {
                    event.originalTarget = null;
                }
                if (event.type === 'mousemove') {
                    TRACKER_CURSOR.setStyles({
                        left: event.clientX + 'px',
                        top:  event.clientY + 'px'
                    });
                }
                if (event.type === 'keypress') {

                    if (!Y.UA.gecko) {
                        val = target.get('value');
                        if (!val) {
                            val = '';
                        }

                        val += String.fromCharCode(event.keyCode || event.charCode);
                        target.set('value', val);
                    } 

                    if (!keyFunc(event)) {
                        return;
                    }
                }
                if (event.type === 'scroll') {
                    target.set('scrollTop', event.scrollTop);
                    target.set('scrollLeft', event.scrollLeft);
                }
                if (event.type === 'blur') {
                    target.blur();
                }
                if (event.type === 'focus') {
                    target.focus();
                }
                if (event.type === 'select') {
                    target.select();
                }
                if (event.type === 'change' && event.selectedIndex) {
                    Y.log('seeting selected index to: ' + event.selectedIndex);
                    Y.log(target);
                    target.set('selectedIndex', event.selectedIndex);
                }
                if (event.type === 'click') {
                    if (target.get('href')) {
    //                    target.set('href', keepGoing(target.get('href'), 'follow'));
    //                    Y.log('TARGET NOW: ' + target.get('href'));
                    }
                }
                /*
                Y.config.doc.body.clientHeight= event.winHeight;
                Y.config.doc.body.clientWidth =event.winWidth;
                Y.config.win.resizeTo(event.winWidth, event.winHeight);

                Y.log(event.type);
                Y.log(event);
                */

                target.simulate(event.type, event);
            } else {
                Y.error('I do not know this event: ' + event.type);
            }
        } catch(e) {
            Y.log('something wrong simulating: ' + e);
            Y.log(event);
        }
    }

    Y.Global.on('events', function(message) {
        if (message.event === 'events') {
            var event = message.data, i = 0, timeout = 0, event_obj, url;
            if (!TRACKER_QUEUE) {
                startFollow();
            }

            Y.log('adding ' + event.length + ' events to queue!');
            for (; i < event.length; i++) {
                event_obj       = Y.JSON.parse(event[i]);
                event_obj.INDEX = message.start + i;
                TRACKER_INDEX   = event_obj.INDEX;
                url             = event_obj.host;

                if (Y.config.win.top == Y.config.win.self) {
                    if (url != Y.config.win.location) {
                        Y.config.win.location = url;
                    }
                }

                if (event.length === 1) {
                    doEvent(event_obj);
                } else {
                    if (i > 0) {
                        timeout = event_obj.timeStamp - Y.JSON.parse(event[i-1]).timeStamp;
                    }
                    TRACKER_QUEUE.add({ fn: doEvent, args: [ event_obj ], timeout: timeout });
                }
            }
            TRACKER_QUEUE.run();
        } else if (message.event === 'stopFollow') {
            stopFollow();
        }
    });

}, '1.0', { requires: [ 'json', 'selector-css3', 'node-event-simulate', 'async-queue'] } );
