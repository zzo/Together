YUI().add('Tfootpanel', function(Y) {
    Y.FootPanel = function(node) {
        this.node = node;

        node.setStyles({
            position: 'fixed',
            bottom: 0, left: 0,
            zIndex: 99999,
            background: '#333232',
            border: '1px solid #c3c3c3',
            borderBottom: 'none',
            width: '94%',
            margin: '0 3%',
            height: '35px',
            borderTopLeftRadius: '4px',
            borderTopRightRadius: '4px',
            boxShadow: '0 0 6px #A6A6A6'
        });

        var dashr = this.addButton('Dashr', 'float: left; padding-left: 20px; margin-left: 20px', function() { top.location.href="http://dashr.net:8081/dashr/index.html"; });
        dashr.removeAttribute('disabled');
        dashr.removeChild(dashr.one('img'));

        var ts = Y.Node.create('<input style="float: left; height: 65%; margin-left: 15px;" value="  <search>" type="text" cols="40" id="together_search" />');
        var but = Y.Node.create('<button style="float: left" id="search_toggle">hide</button>');
        this.node.append(ts);
        /*
        this.node.append(but);
        */
        ts.on('focus', function(e) {
            if (ts.get('value').match(/search/)) {
                ts.set('value', '');
            }
        });
        ts.on('change', function(e) {
            Y.Global.fire('search.request', ts.get('value'));
        });
        but.on('click', function(e) {
            Y.Global.fire('search.toggleView', but);
        });
        var twitter_button = this.addButton('Twitter', 'float: right; padding-right: 20px; margin-right: 20px', function() { Y.Global.fire('toggleTwitterPanel'); });
        var facebook_button = this.addButton('Facebook', 'float: right; padding-right: 20px; margin-right: 20px', function() { Y.Global.fire('toggleFacebookPanel'); });

        Y.Global.on('twitter_activate', function(e) {
            twitter_button.removeAttribute('disabled');
            twitter_button.removeChild(twitter_button.one('img'));
        });

        Y.Global.on('facebook_activate', function(e) {
            facebook_button.removeAttribute('disabled');
            facebook_button.removeChild(facebook_button.one('img'));
        });

    };

    Y.FootPanel.prototype = {
        addButton: function(label, styles, cb) {
            var id = 'together_' + label, button;
            button = Y.one('#' + id);
            if (!button) {
                var button = Y.Node.create('<button id="' + id + '" disabled="disabled" style="' + styles + ' text-decoration: none; color: white; font-size: 1.5em" class="tfootpanel_button" id="' + id + '"><img src="http://dashr.net:8081/loading.gif" />&nbsp;<a href="#">' + label + '</a></button>');
                this.node.append(button);
                button.on('click', cb);
            }

            return button;
        }
    };

}, '1.0', { requires: [ 'node', 'event-custom-base' ]});
