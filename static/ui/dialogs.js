YUI().add('dialogs', function(Y) {
    function dialogs(parentDiv) {

        this.height = 300;
        this.width  = 500;
        this.parentDiv = parentDiv;
        this.sizeOverlay();

        this.overlay = new Y.Overlay({
            // Specify a reference to a node which already exists 
            // on the page and contains header/body/footer content
            srcNode:    'body',
            visible:    true,
            width:      '100%',
            height:     '100%',
            headerContent: 'header',
            bodyContent: 'body',
            footerContent: 'footer'
        });

        Y.one('body').setStyles({ width: this.width, height: this.height, background: '#333232' });

        var _this = this;

        Y.Global.on('join', function(message) {
                Y.log('SHOW DIA');
            _this.show();
//            _this.waitForJoin();
        });

        Y.Global.on('sendMessage', function(message) {
                Y.log('SEND MESSAGE DIALOG');
                });
        Y.Global.on('invite', function(message) {
            _this.waitForInvite();
        }); 

    };

    dialogs.prototype = {
        show : function() {
            this.parentDiv.show();
            this.hidden = false;
        },
        hide : function () {
            this.parentDiv.hide();
            this.hidden = true;
        },
        sizeOverlay: function() {
            var height  = this.height, 
                width   = this.width,
                foot    = this.parentDiv,
                bottom  = foot.get('winHeight') * .75,
                right   = foot.get('winWidth') * .75,
                top     = bottom - height,
                left    = right - width;

            this.parentDiv.setStyles({
                position:   'fixed',
                height:     height,
                width:      width,
                bottom:     height,
                right:      right,
                top:        0,
                left:       0,
                background: 'purple',
                zIndex:     9999
            });
        }
    };

    Y.Dialogs = dialogs;

}, '1.0', { requires: ['overlay', 'event-custom-base' ]});
