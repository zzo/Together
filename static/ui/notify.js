YUI().add('togetherNotify', function(Y) {

    if (!Y.one('#together_notification')) {
        Y.one('body').append('<div id="together_notification" class="yui3-skin-growl"></div>');
    }

    Y.TogetherNotify = function(notify) {
        var _this = this, notify, dialog;

        Y.get = Y.one;
        notify = new Y.Notify({ closable: true });
        notify.render('#together_notification');
        Y.one('.yui3-notify').setStyle('zIndex', 9999);

        dialog = new Y.Dialog();

        this.notify = notify;
        this.dialog = dialog;

        Y.Global.on('join', function(message) {
    //        _this.notify.add({'message': 'Sending Join request to ' + message.name + '...', closable: true});
        });

        Y.Global.on('join', function(message) {
            _this.dialog.alert('waiting to join...!', null, alertCallback);
            function alertCallback() {
                Y.log('Alert callback has fired.');
            }
        });
    };
}, '1.0', { requires: [ 'event-custom-base', 'gallery-notify', 'gallery-dialog' ]});
