modules.define('charts',
    ['i-bem-dom', 'jquery', 'plotly', 'functions__debounce', 'objects',
        'link', 'charts__smoothing', 'checkbox', 'colors', 'BEMHTML'],
    function(provide, bemDom, $, plotly, debounce, objects, Link, Smoothing, Checkbox, colors, BEMHTML) {

        var global = this.global,
            data = {},
            bufferData = {},
            timeSpend = {},
            timeLeft = {},
            trains = [],
            DIRECTIONS_FNS = {
                min : function(x, y) { return !(x < y); },
                max : function(x, y) { return !(x > y); }
            },
            optimumDirections = {},
            optimums = {},
            initOptimum = function() { return { x : NaN, y : NaN }; },
            charts = {},
            chartsCount = 0,
            traces = {},
            traceYs = {},
            tracesForChart = {},
            annotations = {},
            layouts = {},
            Tab = bemDom.declElem(this.name, 'tab'),
            slice= Array.prototype.slice;

        provide(bemDom.declBlock(this.name, {
            onSetMod : {
                'js' : {
                    'inited' : function() {
                        var _this = this;

                        io.connect('/')
                            .on('meta', function(train, fields, chunks) {
                                chunks.forEach(function(chunk) {
                                    chunk[0] === 'iterCount' && (_this._xAxisMax = chunk[1]);
                                    chunk[0] === 'loss' && (optimumDirections[chunk[1]] = chunk[2]);
                                });
                            })
                            .on('timeLeft', this._addTime.bind(this))
                            .on('learnErrorLog', this._addPoints.bind(this, 'learn'))
                            .on('testErrorLog', this._addPoints.bind(this, 'test'));

                        this._events(this._elem('y-axis-type').findChildBlock(Checkbox))
                            .on({ modName : 'checked', modVal : '*' }, function(e, mod) {
                                this._relayoutCharts({ yaxis : { type : mod.modVal ? 'log' : 'linear' } });
                            });

                        var smoothing = this._elem(Smoothing);
                        this._setSmoothRatio(smoothing.getVal());
                        this._events(smoothing).on('change', function(e) {
                            this._setSmoothRatio(e.bemTarget.getVal());
                            if(!objects.isEmpty(data)) {
                                objects.extend(bufferData, data);
                                data = {};
                                this._redraw();
                            }
                        });
                    }
                }
            },

            _xAxisMax : null,

            _setSmoothRatio : function(val) {
                this._smoothRatio = (Math.pow(1000, val) - 1) / 999;
            },

            _getChart : function(id) {
                if(charts[id]) return charts[id];

                this._currentChart || (this._currentChart = id);

                bemDom.append(this._elem('tabs').domElem, BEMHTML.apply({
                    block : 'charts',
                    elem : 'tab',
                    elemMods : { current : !chartsCount, position : chartsCount },
                    js : { chartId : id },
                    content : {
                        block : 'link',
                        mods : { theme : 'islands', pseudo : true },
                        content : id
                    }
                }));

                bemDom.append(this.domElem, BEMHTML.apply({
                    block : 'charts',
                    elem : 'chart',
                    elemMods : { current : !chartsCount, position : chartsCount },
                    content : { elem : 'plotly' }
                }));

                chartsCount++;

                return charts[id] = plotly(
                    this.domElem.find('.charts__plotly').last()[0],
                    tracesForChart[id],
                    getLayout(id, {
                        xaxis : {
                            range : [0, this._xAxisMax],
                            type : 'linear',
                            tickmode : 'auto',
                            showspikes : true,
                            spikethickness : 1,
                            spikedash : 'longdashdot',
                            spikemode : 'across',
                            zeroline : false,
                            showgrid : false
                        },
                        yaxis : {
                            zeroline : false,
                            showgrid : false
                            //hoverformat : '.7f'
                        },
                        separators : '. ',
                        hovermode : 'x',
                        margin : { l : 35, r : 0, t : 35, b : 30 },
                        autosize : true,
                        showlegend : false
                    }),
                    {
                        scrollZoom : true,
                        modeBarButtonsToRemove : ['toImage', 'sendDataToCloud', 'toggleSpikelines'],
                        displaylogo : false
                    }
                )
                    .on('hover', this._onChartHover.bind(this))
                    .on('click', this._onChartClick.bind(this));
            },

            _addPoints : function(type, train, fields, chunks) {
                forEachField(fields, function(field, fieldIndex, iterIndex) {
                    var dataByType = getData(bufferData, field, train, type);

                    forEachChunk(chunks, fieldIndex, iterIndex, function(value) {
                        dataByType.push(value);
                    });
                });

                this._redraw();
            },

            _addTime : function(train, fields, chunks) {
                get(timeSpend, train, Array);

                forEachField(fields, function(field, fieldIndex, iterIndex) {
                    forEachChunk(chunks, fieldIndex, iterIndex, function(value) {
                        switch(field) {
                        case 'timeSpend':
                            timeSpend[train].push(stringifyTime(value));
                            break;
                        case 'timeLeft':
                            var tooltipData = {};
                            tooltipData[train] = {
                                'time-left' : timeLeft[train] = stringifyTime(value)
                            };
                            this._emitTooltip(tooltipData);
                            break;
                        }
                    }, this);
                }, this);
            },

            _redraw : debounce(
                function() {
                    var _this = this;
                    requestAnimationFrame(function() {
                        var currentError = _this._currentChart;
                        objects.each(bufferData, function(newDataByError, error) {
                            if(!charts[error] || currentError === error) {
                                mergeDataByError(error, data, bufferData);

                                addDataToTraces(error, newDataByError, _this._smoothRatio);

                                getLayout(error, { annotations : _this._getAnnotations(error) });

                                _this._getChart(error).redraw();

                                delete bufferData[error];
                            }
                        });
                    });
                },
                150),

            _redrawCurrentChart : function() {
                this._getChart(this._currentChart).redraw();
            },

            _getAnnotations : function(error) {
                var _this = this;

                return $.map(get2(optimums, this._smoothRatio, error), function(optimum, train) {
                    if(isNaN(optimum.y)) return;

                    if(_this._currentChart === error) {
                        var tooltipData = {};
                        tooltipData[train] = {
                            best : optimumDirections[error] + ' ' + optimum.y.toPrecision(7)
                        };
                        _this._emitTooltip(tooltipData);
                    }

                    return objects.extend(
                        get2(annotations, error, train, {
                            text : optimumDirections[error],
                            opacity : 0.75,
                            arrowhead : 6,
                            arrowwidth : 1
                        }),
                        {
                            x : optimum.x,
                            y : optimum.y,
                            hovertext : optimum.x + '<br>' + optimum.y.toPrecision(7)
                        }
                    );
                });
            },

            _showTooltip : function(e) {
                var iter = getMinPoint(e.points),
                    byTrains = {};

                objectsEach2(data[this._currentChart], function(dataByType, type, train) {
                    var res = get(byTrains, train);
                    res[type] = dataByType[iter];
                    res.iter || (res.iter = iter);
                    res['time-spend'] || (res['time-spend'] = timeSpend[train][iter]);
                    res['time-left'] || (res['time-left'] = timeLeft[train]);
                });

                this._emitTooltip(byTrains);
            },

            _emitTooltip : (function debounceMerged(fn, timeout) {
                var timer, allData = {};

                return function(data) {
                    global.clearTimeout(timer);

                    objects.each(data, function(v, k) {
                        objects.extend(get(allData, k), v);
                    });

                    var _this = this;
                    timer = global.setTimeout(
                        function() { fn.call(_this, allData); },
                        timeout);
                };
            })(
                function(data) { this._emit('tooltip', data); },
                50),

            _onChartHover : function(e) {
                this._tooltipFixed || this._showTooltip(e);
            },

            _onChartClick : function(e) {
                this._tooltipFixed = !this._tooltipFixed;
                this._showTooltip(e);
            },

            _onLinkClick : function(e) {
                var nextTab = e.bemTarget.findParentElem(Tab);
                if(nextTab) {
                    var prevTab = this.findChildElem({ elem : Tab, modName : 'current', modVal : true })
                        .delMod('current');
                    this.findChildElem({ elem : 'chart', modName : 'position', modVal : prevTab.getMod('position') })
                        .delMod('current');

                    nextTab.setMod('current');
                    this.findChildElem({ elem : 'chart', modName : 'position', modVal : nextTab.getMod('position') })
                        .setMod('current');

                    this._currentChart = nextTab.params.chartId;
                    this._redraw();
                    this._redrawCurrentChart();
                }
            },

            toggleVisibilityByType : function(type, visible) {
                type === 'test' && objectsEach2(annotations, function(annotation) {
                    annotation.visible = visible;
                });

                objectsEach2(traces, function(tracesByTrain) {
                    tracesByTrain[type].visible = visible;
                });

                this._redrawCurrentChart();
            },

            toggleVisibilityByTrain : function(train, visible) {
                objects.each(annotations, function(annotationsByError) {
                    annotationsByError[train].visible = visible;
                });

                objects.each(traces, function(tracesByError) {
                    ['test', 'learn'].forEach(function(type) {
                        tracesByError[train][type].visible = visible;
                    });
                });

                this._redrawCurrentChart();
            },

            _restyleCharts : function(update, traces) {
                this._forEachChartCall('restyle', update, traces);
            },

            _relayoutCharts : function(update) {
                this._forEachChartCall('relayout', update);
            },

            _forEachChartCall : function(method) {
                var args = slice.call(arguments, 1);
                objects.each(charts, function(chart) {
                    chart[method].apply(chart, args);
                });
            }
        }, {
            onInit : function() {
                this._events(Link).on('click', this.prototype._onLinkClick);
            }
        }));

        function forEachField(fields, fn, ctx) {
            var iterIndex = fields.indexOf('iter');

            fields.forEach(function(name, index) {
                if(index === iterIndex) return;
                fn.call(ctx, name, index, iterIndex);
            });
        }

        function forEachChunk(chunks, fieldIndex, iterIndex, fn, ctx) {
            chunks.forEach(function(chunk) {
                chunk.hasOwnProperty(fieldIndex) &&
                    fn.call(ctx, chunk[fieldIndex], chunk[iterIndex]);
            });
        }

        function objectsEach2(obj, fn, ctx) {
            objects.each(obj, function(obj1, key1) {
                objects.each(obj1, function(obj2, key2) {
                    fn.call(ctx, obj2, key2, key1, obj1);
                });
            });
        }

        function stringifyTime(time) {
            if(!time) return '0ms';

            var ms = time % 1000;
            time = Math.floor(time / 1000);
            var s = time % 60;
            time = Math.floor(time / 60);
            var m = time % 60,
                h = Math.floor(time / 60);

            var res = [];

            h && res.push(h + 'h');
            m && res.push(m + 'm');
            (s || ms) && res.push(s + (ms > 500 ? 1 : 0) + 's');
            //s && res.push(s + 's');
            //ms && res.push(ms + 'ms');

            return res.join(' ');
        }

        function getMinPoint(points) {
            var i = 1, point = points[0], min = point.x;
            while(point = points[i++]) min > point.x && (min = point.x);
            return min;
        }

        function getData(data, error, train, type) {
            return get2(data, error, train, function() {
                trains.push(train);
                return { learn : [], test : [] };
            })[type];
        }

        function get(obj, key, init) {
            return obj[key] ||
                (obj[key] = typeof init === 'function'?
                    init() :
                    init || {});
        }

        function get2(obj, key1, key2, init) {
            return get(get(obj, key1), key2, init);
        }

        function mergeDataByError(error, data1, data2) {
            objectsEach2(data2[error], function(data2ByType, type, train) {
                var data1ByType = getData(data1, error, train, type);
                data1ByType.push.apply(data1ByType, data2ByType);
            });
        }

        function pushArrayToArray(to, from) {
            to.push.apply(to, from);
            return to;
        }

        function getLayout(error, patch) {
            return layouts[error] = objects.extend(layouts[error], patch);
        }

        function getTrace(smoothRatio, error, train, type) {
            var trace = get(get2(traces, error, train), type, function() {
                var trace = {
                    name : train + ' ' + type,
                    y : [],
                    hovertext : [],
                    hoverinfo : 'text+x',
                    line : {
                        width : 1,
                        dash : type === 'learn'? 'dot' : 'solid',
                        color : colors.string2color(train)
                        //smoothing : 1.3,
                        //shape : 'spline'
                    },
                    mode : 'lines',
                    hoveron : 'points'
                };

                get(tracesForChart, error, Array).push(trace);

                return trace;
            });

            trace.y = get2(get2(traceYs, smoothRatio, error), train, type, Array);

            return trace;
        }

        function addDataToTraces(error, newData, smoothRatio) {
            var optimumsByError = get2(optimums, smoothRatio, error),
                optimumDirection = DIRECTIONS_FNS[optimumDirections[error]];

            objectsEach2(newData, function(dataByType, type, train) {
                var optimumByTrain = get(optimumsByError, train, initOptimum),
                    trace = getTrace(smoothRatio, error, train, type),
                    allDataByType = getData(data, error, train, type),
                    smoothedDataByType = smooth(allDataByType, allDataByType.length - trace.y.length, smoothRatio);

                pushArrayToArray(trace.y, smoothedDataByType);

                pushArrayToArray(trace.hovertext, smoothedDataByType.map(function(d, i) {
                    var isTest = type === 'test',
                        iter = allDataByType.length - (dataByType.length - i);

                    if(isTest && optimumDirection && optimumDirection(optimumByTrain.y, d)) {
                        optimumByTrain.y = d;
                        optimumByTrain.x = iter;
                    }

                    return d.toPrecision(7) +
                        (isTest?
                            '<br>Time spend: ' + timeSpend[train][iter] :
                            '');
                }));
            });
        }

        function smooth(allData, amount, ratio) {
            var allDataLength = allData.length;

            if(!ratio) return allData.slice(allDataLength - amount);

            var radius = Math.floor(ratio * allDataLength / 2),
                res = [],
                i = allDataLength - amount - 1;

            while(++i < allDataLength) {
                var ii = allDataLength - amount + i,
                    left = ii - Math.min(radius, ii),
                    right = ii + Math.min(radius, amount - i - 1),
                    sum = 0,
                    j = left - 1;

                while(++j <= right) sum += allData[j];

                res.push(sum / (right - left + 1));
            }

            return res;
        }
    });
