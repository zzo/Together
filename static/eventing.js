YUI().add('eventing', function(Y) {
    var body = Y.one('body'), TRACKER_QUEUE, TRACKER_CURSOR, eventCapture = false,
            TRACKER_EVENTS = [
            'click',
            'dblclick',
            'mousedown',
            'mouseup',
            'mouseover',
            'mousemove',
            'mouseout',
            'keyup',
            'keydown',
            'keypress',
            'blur',
            'change',
            'focus',
            'resize',
            'scroll',
            'select'
        ], keys = [
            // Mouse Events
            { key: 'altKey' },
            { key: 'bubbles' },
            { key: 'button' },
            { key: 'cancelable'},
            { key: 'clientX'},
            { key: 'clientY'},
            { key: 'ctrlKey'},
            { key: 'detail'},
            { key: 'eventPhase'},
            { key: 'isChar' },
            { key: 'isTrusted' },
            { key: 'layerX' },
            { key: 'layerY' },
            { key: 'metaKey' },
            { key: 'originalTarget', func: getCSSTo  },
            { key: 'pageX' },
            { key: 'pageY'},
            { key: 'rangeParent', func: getCSSTo },
            { key: 'relatedTarget', func: getCSSTo },
            { key: 'screenX'},
            { key: 'screenY'},
            { key: 'shiftKey' },
            { key: 'target', func: getCSSTo },
            { key: 'timeStamp', func: function() { return new Date().getTime(); } },
            { key: 'type'},
            { key: 'view', func: getCSSTo },
            { key: 'which'},

            // Key Events
            { key: 'keyCode'},
            { key: 'charCode'}
        ], def_func = function(val) { return val; },
            handleEvent = function(e) {
                var ev = {}, i, key, func, target, msg, cfg, request, html, iframe;
                try {
                    for (i = 0; i < keys.length; i++) {
                        key = keys[i].key;
                        func = keys[i].func || def_func;
                        ev[key] = func(e[key]);
                    }

                    target = new Y.Node(e.target);
                    ev.winHeight    = target.get('winHeight');
                    ev.winWidth     = target.get('winWidth');
                    ev.host         = Y.config.win.location.href,

                    if (ev.type === 'scroll') {
                        ev.scrollTop  = target.get('scrollTop');
                        ev.scrollLeft = target.get('scrollLeft');
                    }

                    if (ev.type === 'change') {
                        if (e.target.selectedIndex) {
                            ev.selectedIndex = e.target.selectedIndex;
                        }
                    }

                    if (ev.type === 'click') {
                        if (target.get('href')) {
                            target.set('href', keepGoing(target.get('href'), 'capture'));
                            Y.log('TARGET NOW: ' + target.get('href'));
                       }
                    }

                    /*
                    if (ev.type.match(/^key/)) {
                        Y.log(ev.type);
                        Y.log(ev);
                        Y.log(e);
                        Y.log('-----');
                    }

                    Y.log('sending:');
                    Y.log(ev);
                    */
                    Y.Global.throw('sendMessage', { event: 'event', data: ev, uid: FB_USER_ID });

                } catch(E) {
                    Y.log('STRINGIFY FAILED!');
                    Y.log(E);
                }
            };

    function getCSSTo(element) {
        var count = 0, siblings, sibling, i;

        if (!element) {
            return null;
        }

        if (element === Y.config.win) {
            return 'window';
        }

        if (element === Y.config.doc) {
            return 'document';
        }

        if (element === Y.config.doc.body) {
            return '';
        }

        try {
            if (!element.parentNode) {
                return null;
            }
        } catch(e) {
            return null;
        }

        if (element.id && !element.id.match(/^yui_/)) {
            return ' #' + element.id;
        }

        siblings = element.parentNode.childNodes;
        for (i = 0; i < siblings.length; i++) {
            sibling = siblings[i];
            if (sibling.tagName) { count++; }
            if (sibling === element) {
                return getCSSTo(element.parentNode) + ' ' + element.tagName+':'+'nth-child(' + count + ')';
            }
        }

        return null;
    }

    function setUpEvents() {
        Y.Array.each(TRACKER_EVENTS, function(event) {
            if (Y.config.win.addEventListener) {
                Y.config.win.addEventListener(event, handleEvent, true);
            } else {
                Y.config.win.attachEvent('on' + event, handleEvent, true);
            }
        });

    }

    function tearDownEvents() {
        Y.Array.each(TRACKER_EVENTS, function(event) {
            if (Y.config.win.removeEventListener) {
                Y.config.win.removeEventListener(event, handleEvent, true);
            } else {
                Y.config.win.detachEvent('on' + event, handleEvent);
            }
        });
    }

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
            shim = Y.Node.create('<div id="TRACKER_SHIM"><img style="opacity: 1; z-index: 999009; position: absolute" id="TRACKER_CURSOR" src="http://' + SERVER + ':' + PORT + '/pointer_cursor.png"></img></div>');

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
                zIndex:          '20',
                overflow:        'hidden',
                backgroundColor: bcolor,
                display:         'none',
                height:          '5px',
                width:           '5px',
                top:             '0px',
                left:            '0px',
                borderWidth:     '0 0 0 2px !important'
            });
            Y.on('window:resize', sizeShim);
            body.append(shim);
            TRACKER_CURSOR = Y.one('#TRACKER_CURSOR');
        }

        if (!TRACKER_QUEUE) {
            TRACKER_QUEUE = new Y.AsyncQueue();
            TRACKER_QUEUE.on('complete', stopFollow);
        } else {
            TRACKER_QUEUE.stop();
        }

        sizeShim();
        shim.setStyle('display', 'block');
    }

    function doEvent(event) {
        var val, target = Y.Node.one(event.target);

        try {
        if (event.target === 'window') {
            target = Y.config.win;
        }

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
                    target.set('href', keepGoing(target.get('href'), 'follow'));
                    Y.log('TARGET NOW: ' + target.get('href'));
                }
            }
            /*
            Y.config.doc.body.clientHeight= event.winHeight;
            Y.config.doc.body.clientWidth =event.winWidth;
            Y.config.win.resizeTo(event.winWidth, event.winHeight);

            Y.log(event.type);
            Y.log(event);
            */

            if (target === Y.config.win) {
                target = Y.one('document');//Y.config.doc.body;
            }
            target.simulate(event.type, event);
        } else {
            Y.error('I do not know this event: ' + event.type);
        }

        } catch(e) {
            Y.log('something wrong simulating: ' + e);
        }

    }

    Y.Global.on('start_together', function() {
        if (!eventCapture) {
            eventCapture = true;
            setUpEvents();
        }
    });

    Y.Global.on('stop_together', function() {
        if (eventCapture) {
            eventCapture = false;
            tearDownEvents(func);
        }
    });

}, '1.0', { requires: [ 'json', 'selector-css3', 'node-event-simulate', 'event-delegate', 'async-queue'] } );
