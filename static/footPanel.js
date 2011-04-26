YUI().add('Tfootpanel', function(Y) {
    Y.FootPanel = function(node) {
        this.node = node;

        node.setStyles({
            position: 'fixed',
            bottom: 0, left: 0,
            zIndex: 9999,
            background: '#333232',
            border: '1px solid #c3c3c3',
            borderBottom: 'none',
            width: '94%',
            margin: '0 3%',
            height: '35px'
        });

        this.addButton('Together',       'float: left; margin-left: 20px', function() {});
        this.addButton('OnlineFriends',  'float: right; margin-right: 20px', function() { Y.Global.fire('toggleFriendsPanel') });
    };


    Y.FootPanel.prototype = {
        addButton: function(label, styles, cb) {
            var id = 'together_' + label;
            if (!Y.one('#' + id)) {
                var button = Y.Node.create('<button style="' + styles + ' text-decoration: none; color: white; font-size: 1.5em" class="tfootpanel_button" id="' + id + '"><a href="#">' + label + '</a></button>');
                this.node.append(button);
                Y.on('available', function(me) { Y.log("BUTTON AVAIL: " + me); }, '#' + id);
            }

            var button = Y.one('#' + id);
            button.on('click', cb);
        }
    };

}, '1.0', { requires: [ 'node', 'event-custom-base' ]});
