YUI().add('togetherNotify', function(Y) {

    if (!Y.one('#together_notification')) {
        Y.one('body').append('<div id="together_notification" class="yui3-skin-growl"></div>');
        Y.one('body').addClass('yui3-skin-xarno-smooth');
    }

    Y.TogetherNotify = function(notify) {
        var _this = this, dialog;

        Y.get = Y.one;
        notify = new Y.Notify({ prepend: true, closable: false });
        notify.render('#together_notification');
        Y.one('.yui3-notify').setStyle('zIndex', 9999);

        dialog = new Y.Dialog();

        this.notify = notify;
        this.dialog = dialog;

        Y.Global.on('notify', function(message) {
            _this.notify.add({ message: message.message });
        });

        /*
        Y.Global.on('join', function(message) {
            _this.notify.add({'message': 'Sending Join request to ' + message.name + '...' });
        });

        Y.Global.on('join_request', function(message) {
            var response = { event: 'join_response', them: message.from };
            _this.confirmButton('Join', message.name + ' wants to join you...',
                function(){ response.response = true;  Y.Global.fire('sendMessage', response); },
                function(){ response.response = false; Y.Global.fire('sendMessage', response); }
            );
        });

        Y.Global.on('join_response', function(message) {
            _this.notify.add({ 'message': message.name + ' has ' + (message.response ? 'accepted' : 'denied' )  + ' your join request' });
        });

        Y.Global.on('fbstatus_change', function(msg) {
            var message = msg.from.name + ' sez:<br/>';
            if (msg.link) {
                message += '<a href="' + msg.link + '" target="_blank">';
            }
            if (msg.picture) {
                message += '<msg src="' + msg.picture + '" />';
            }

            message += msg.message;

            if (msg.link) {
                message += '</a>';
            }

            if (msg.actions) {
                message += '<br />';
                for (var i = 0; i < msg.actions.length; i++) {
                    message += '<a href="' + msg.actions[i].link + '" target="_blank">' + msg.actions[i].name + '</a>'
                }
            }

            _this.notify.add({ 'message': message });
        });
        */
    };

    Y.TogetherNotify.prototype = {
        confirmButton: function(type, body, allowcb, denycb) {
            dialog = this.dialog;

            dialog.set('icon', 'confirm');
            dialog.addCallback('allow', allowcb);
            dialog.addCallback('deny', denycb);

            var header = type + ' Request',
                allowBtn = new Y.Button({
                    label: 'Allow',
                    callback: Y.bind(function(e){
                        this.hide('allow');
                    }, dialog),
                    'default': true
                }),
                denyBtn = new Y.Button({
                    label: 'Deny',
                    callback: Y.bind(function(e){
                        this.hide('deny');
                    },  dialog)
                });

            dialog.build(header, body, [allowBtn, denyBtn]).show();
        }
    };
}, '1.0', { requires: [ 'event-custom-base', 'gallery-notify', 'gallery-dialog', 'gallery-button' ]});
