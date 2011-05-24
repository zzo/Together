YUI().add('searchTable', function(Y) {
    function st(parentDiv) {
        var _this = this;

        this.height = 300;
        this.width  = 500;

        this.recordset = new Y.Recordset();
        this.recordset.plug(Y.Plugin.RecordsetIndexer);
        this.parentDiv = parentDiv;

        this.sizeParent();

        function result(o) {
            var description   = o.record.getValue('description'),
                displayURL    = o.record.getValue('displayURL'),
                title         = o.record.getValue('title'),
                url           = o.record.getValue('url'),
                handler = "window.open('" + url + "', '" + title + "', 'scrollbars=yes,width=500,height=300,top=200,left=200'); return false;",
                href    = '<a href="javascript:void(0)" onclick="' + handler + '">';
                row = '<h4>' + href +  title + '</a></h4>';

            if (description) {
                row += '<h5>' + description + '</h5>';
            }
            row += href + displayURL + '</a>';
            return row;
        }

        var cols = [
            {
                key: "results",
                sortable: false,
                formatter: result
            }
        ];

        this.searchTable = new Y.DataTable.Base({
            columnset: cols,
            width: this.width
        });

        // body in the iframe
        this.hide();
        this.searchTable.render(Y.one('body'));

        Y.Global.on('search.results', function(message) {
            _this.recordset.empty();
            for (var i = 0; i < message.results.length; i++) {
                _this.recordset.add(message.results[i]);
            }

            _this.searchTable.set('recordset', _this.recordset);
            _this.searchTable.set('caption', 'Search results for "' + message.query + '"');
            Y.Global.fire('updateSearchCount', _this.recordset.getLength());
            _this.show();
        });

        Y.Global.on('search.toggleView', function(button) {
            if (_this.hidden) {
                _this.show();
                button.set('innerHTML', 'hide');
            } else {
                _this.hide();
                button.set('innerHTML', 'show');
            }
        });
    };

    st.prototype = {
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
                right   = foot.get('winWidth') * .45,  // Tfootpanel is 5% of width
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
        }
    };

    Y.SearchTable = st;
}, '1.0', { requires: ['node', 'recordset-base', 'datatable', 'recordset-indexer', 'event-custom-base', 'event-delegate' ]});

YUI().add('search', function(Y) {
    var appId = '677AFDF314A3AF72FD68BFA84DF2922547E17F5C';
    var search = function(parentDiv) {
        var _this = this;
        Y.Global.on('search.request', function(searchTerm) {
            _this.doSearch(searchTerm);
        });

        this.table = new Y.SearchTable(parentDiv);
    };

    search.prototype = {
        doSearch : function(term) {

            var qs = 'AppId=' + appId + '&Query=' + encodeURI(term) + '&Sources=Web&JsonType=function',
                url = 'http://api.bing.net/json.aspx?' + qs;

            Y.Get.script(url, { context: this, onSuccess: function(obj) { this.searchResults(BingGetResponse()); } });
        },
        searchResults: function(results) {
            var base = results.SearchResponse,
                query = base.Query.SearchTerms,
                searchResults = base.Web.Results,
                givenLen = searchResults.length,
                normalizedResults = { results: [], query: query, total: base.Web.Total, totalGiven: givenLen };

            for (var i = 0; i < givenLen; i++) {
                var result = searchResults[i];
                normalizedResults.results.push({ description: result.Description, displayURL: result.DisplayUrl, title: result.Title, url: result.Url });
            }

            Y.Global.fire('search.results', normalizedResults);

            Y.log('search results');
            Y.log(results);
        }
    };

    Y.Search = search;
}, '1.0', { requires: [ 'node', 'json-parse', 'io-base', 'querystring-stringify-simple', 'searchTable' ]});

