YUI().add('searchTable', function(Y) {
    function st(parentDiv) {
        var result = function(o) {
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
            },
        cols = [
            {
                key: "Search Results",
                sortable: false,
                formatter: result
            }
        ], _this = this;

        Y.Global.on('search.results', function(message) {
            _this.recordset.empty();
            for (var i = 0; i < message.results.length; i++) {
                _this.recordset.add(message.results[i]);
            }

            _this.table.set('recordset', _this.recordset);
            _this.table.set('caption', 'Search results for "' + message.query + '"');
            Y.Global.fire('updateSearchCount', _this.recordset.getLength());

            _this.display();
        });

        st.superclass.constructor.call(this, { parentDiv: parentDiv, toggleEvent: 'search.toggleView', buttonOffset: .45, cols: cols });
    };

    Y.SearchTable = st;
    Y.extend(Y.SearchTable, Y.BaseTable);

}, '1.0', { requires: ['baseTable']});

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
        }
    };

    Y.Search = search;
}, '1.0', { requires: [ 'searchTable' ]});

