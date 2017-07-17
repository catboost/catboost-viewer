modules.define('plotly', ['inherit'], function(provide, inherit) {
    var plotlyProxies = {};
    function buildPlotlyProxy(method) {
        return plotlyProxies[method] || (plotlyProxies[method] = function() {
            var args = [this._domNode];
            args.push.apply(args, arguments);
            Plotly[method].apply(Plotly, args);
            return this;
        });
    }

    var PlotlyWrap = inherit({
        __constructor : function(domNode, data, layout, options) {
            this._domNode = domNode;
            this._data = data;

            this._traces = {};
            this._tracesCount = 0;

            this._countTraces(data);

            Plotly.plot(domNode, data, layout, options);
        },

        _countTraces : function(data) {
            data.forEach(function(t) {
                this._traces[t.name] || (this._traces[t.name] = this._tracesCount++);
            }, this);
        },

        relayout : buildPlotlyProxy('relayout'),

        restyle : function(update, traces) {
            return buildPlotlyProxy('restyle')
                .call(this, update, traces && this._convertTracesNamesToIdxs(traces));
        },

        update : buildPlotlyProxy('update'),

        redraw : buildPlotlyProxy('redraw'),

        on : function(event, fn) {
            this._domNode.on('plotly_' + event, fn);
            return this;
        },

        addTraces : buildPlotlyProxy('addTraces'),

        extendTraces : buildPlotlyProxy('extendTraces'),

        restyleTraces : function(update) {
            var traces = this._traces,
                restyle = [],
                restyleIdxs = [];

            update.forEach(function(trace) {
                if(traces.hasOwnProperty(trace.name)) {
                    restyle.push(trace);
                    restyleIdxs.push(traces[trace.name]);
                }
            });

            return this.restyle(restyle, restyleIdxs);
        },

        updateTraces : function(update) {
            var traces = this._traces,
                add = [],
                extend = [],
                extendTexts = [],
                extendIdxs = [];

            update.forEach(function(trace) {
                if(traces.hasOwnProperty(trace.name)) {
                    if(trace.y.length) {
                        extend.push(trace.y);
                        extendTexts.push(trace.hovertext);
                        extendIdxs.push(traces[trace.name]);
                    }
                } else
                    trace.y.length && add.push(trace);
            });

            add.length && this.addTraces(add)._countTraces(add);

            extend.length && this.extendTraces({ y : extend, hovertext : extendTexts }, extendIdxs);

            return this;
        },

        _convertTracesNamesToIdxs : function(tracesNames) {
            var traces = this._traces,
                res = [];

            tracesNames.forEach(function(trace) {
                typeof trace === 'number'?
                    res.push(trace) :
                    traces.hasOwnProperty(trace) && res.push(traces[trace]);
            }, this);

            return res;
        }
    });

    provide(function(domNode, data, layout, options) {
        return new PlotlyWrap(domNode, data, layout, options);
    });
});
