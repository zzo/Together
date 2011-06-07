YUI().add('baseTable', function(Y) {

    var bt = function(args) {
        var _this = this;

        this.rendered     = false;
        this.parentDiv    = args.parentDiv;
        this.buttonOffset = args.buttonOffset;

        this.height = 300;
        this.width  = 500;

        this.recordset = new Y.Recordset();
        this.sizeParent();

        this.table = new Y.DataTable.Base({
            columnset: args.cols,
            width:     this.width
        });

        // body in the iframe
        this.hide();
        var closeButton = Y.Node.create('<button style="float: right; height: 20px; width: 20px;">X</button>');
        Y.one('body').prepend(closeButton);
        closeButton.on('click', function(e) { _this.hide(); });

        Y.Global.on(args.toggleEvent, function() {
            if (_this.hidden) {
                _this.display();
                _this.show();
            } else {
                _this.hide();
            }
        });
    };

    bt.prototype = {
        show : function() {
            this.parentDiv.show();
            this.hidden = false;
        },
        hide : function () {
            this.parentDiv.hide();
            this.hidden = true;
        },
        sizeParent: function() {
            var height  = this.height, 
                width   = this.width,
                foot    = this.parentDiv,
                bottom  = foot.get('winHeight') - 35,  // 35 is height of Tfootpanel
                right   = foot.get('winWidth') * this.buttonOffset,  // Tfootpanel is 5% of width
                top     = bottom - height,
                left    = right - width;

            this.parentDiv.setStyles({
                position:   'fixed',
                height:     height,
                width:      width,
                bottom:     bottom,
                right:      right,
                top:        top,
                left:       left,
                zIndex:     9999
            });
        },
        display: function() {
            this.table.plug(Y.Plugin.DataTableScroll, {
                height: this.height - 20,
                width:  this.width
            });
            this.table.plug(Y.Plugin.DataTableSort);

            this.table.render(Y.one('body'));
//            new Y.DD.Drag({ node: 'body' });
            this.show();
            this.rendered = true;
        }
    };

    Y.BaseTable = bt;
}, '1.0', { requires: ['node', 'recordset-base', 'datatable', 'recordset-indexer', 'event-custom-base', 'dd-drag' ]});
