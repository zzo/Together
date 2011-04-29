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
                Y.log(message);
            _this.notify.add({ 'message': message.name + ' has ' + (message.response ? 'allowed' : 'denied' )  + ' your join request' });
        });
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
