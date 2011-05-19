YUI().add('togetherLoader', function(Y) {
    var modules = [
        { id: 'Tfootpanel',         file: 'ui/footPanel.js',                requires: [ 'node', 'event-custom-base' ], class: 'FootPanel',   createDiv: true,
          css: [ 
          'http://yui.yahooapis.com/combo?3.3.0/build/cssreset/reset-min.css&3.3.0/build/cssfonts/fonts-min.css&3.3.0/build/widget/assets/skins/sam/widget.css'
          ]
        },
        { id: 'keepAlive', file: 'start/keepAlive.js', requires: [ 'event-custom-base' ] },
//        { id: 'eventing-leader',    file: 'eventing/eventing-leader.js',    requires: [ 'json', 'selector-css3', 'event-delegate', 'event-custom-base' ] },
//        { id: 'eventing-follower',  file: 'eventing/eventing-follower.js',  requires: [ 'json', 'selector-css3', 'node-event-simulate', 'async-queue', 'event-custom-base'] },
//        { id: 'notify',    file: 'ui/notify.js',          requires: [ 'event-custom-base', 'gallery-notify' ], createDiv: true, class: 'TNotify' },
        { id: 'facebook',  file: 'facebook/facebook.js',  requires: [ 'node', 'json', 'event-custom-base', 'recordset-base', 'datatable', 'recordset-indexer', 'event-delegate' ], class: 'Facebook', createDiv: true, iframe: true, scrolling: 'yes' },
        { id: 'twitter',  file: 'twitter/twitter.js',     requires: [ 'node', 'json', 'event-custom-base', 'recordset-base', 'datatable', 'recordset-indexer', 'event-delegate' ], class: 'Twitter', createDiv: true, iframe: true, scrolling: 'yes' }
/*
        { id: 'dialogs', file: 'ui/dialogs.js', requires: [ 'overlay', 'event-custom-base' ], class: 'Dialogs', createDiv: true, iframe: true,
          css: [
          'http://yui.yahooapis.com/combo?3.3.0/build/cssreset/reset-min.css&3.3.0/build/cssfonts/fonts-min.css&3.3.0/build/widget/assets/skins/sam/widget-stack.css&3.3.0/build/overlay/assets/skins/sam/overlay.css'
          ]
        }
*/
    ];

    Y.TogetherLoader = function(config) {
        this.SERVER = config.server;
        this.PORT   = config.port;

        function createSandbox(node, css, modules) {
            var iframe = Y.Node.create('<iframe style="background: red;" width="100%" height="100%"  border="0" frameBorder="0" marginWidth="0" marginHeight="0" leftMargin="0" topMargin="0" allowTransparency="true"></iframe>'),
                DEFAULT_CSS = '',
                BODY= '<body class="yui3-skin-sam"><br></body>',
                META = '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>',
                STYLE = 'html{overflow:hidden;border:0;margin:0;padding:0;}',
                doc, html;

            if (typeof css != 'object') {
                css = [ css ];
            }
            Y.each(css, function(link) {
                if (link) {
                    if (!link.match(/^http/)) {
                        link = 'http://' + this.SERVER + ':' + PORT + link;
                    }
                    DEFAULT_CSS += '<link rel="stylesheet" type="text/css" href="' + link + '">';
                }
            });

            html = '<!doctype html><html><head>' + META + DEFAULT_CSS + '<style>' + STYLE + '</style></head>' + BODY + '</html>';

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
                    return config.pipeline.Get.script.apply(config.pipeline, arguments);
                };
            })

            //iframe._node.contentWindow.YUI = sub_yui;
            return { yui: sub_yui, iframe: iframe };
        }

       // load up modules
        modules.forEach(function(module) {
            var hash = {}, css = '';
            if (module.id) {
                hash[module.id] = { 
                    fullpath: 'http://' + SERVER + ':' + PORT + '/' + module.file,
                    requires: module.requires
                }
            }

            var myY = YUI, node;

            if (module.createDiv) {
                var ret = Y.one('body').append('<div style="border: 2px solid black" id="' + module.id + '"></div>');
                node = Y.one('#' + module.id);
            }

            if (module.iframe) {
                // Create an irame sandbox for this module
                var obj = createSandbox(Y.one('#' + module.id), module.css, hash);
                myY = obj.yui;
                if (module.scrolling) {
                    obj.iframe.setAttribute('scrolling', module.scrolling);
                }
                myY.use(module.id, function(Y) {
                    if (Y[module.class]) {
                        new Y[module.class](node, obj.iframe);
                    }
                });
            } else {
                // Just load it up here
                //
                myY({ modules: hash, win: window, doc: document }).use(module.id, function(Y) {
                    Y.log('LOADED MODULE: ' + module.id);
                    if (Y[module.class]) {
                        new Y[module.class](node);
                    }
                });
            }
        });
    };

        Y.log('LOADER LOADED');
});

