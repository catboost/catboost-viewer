modules.define('legend',
    ['i-bem-dom', 'jquery', 'checkbox', 'page-index', 'charts', 'colors', 'BEMHTML'],
    function(provide, bemDom, $, Checkbox, PageIndex, Charts, colors, BEMHTML) {

        var trains = {};

        provide(bemDom.declBlock(this.name, {
            onSetMod : {
                'js' : {
                    'inited' : function() {
                        var charts = this._charts = this.findParentBlock(PageIndex).findChildBlock(Charts);

                        this._events(charts).on('tooltip', function(e, data) {
                            this._update(data);
                        });

                        this._elem('learn-test')._events(Checkbox)
                            .on({ modName : 'checked', modVal : '*' }, function(e, mod) {
                                charts.toggleVisibilityByType(e.bemTarget.getName(), !!mod.modVal);
                            });

                        this._elem('trains')._events(Checkbox)
                            .on({ modName : 'checked', modVal : '*' }, function(e, mod) {
                                charts.toggleVisibilityByTrain(e.bemTarget.getName(), !!mod.modVal);
                            });
                    }
                }
            },

            _update : function(data) {
                var _this = this;

                $.each(trains, function(trainId, train) {
                    var trainData = data[trainId];
                    trainData &&
                        ['learn', 'test', 'time-spend', 'time-left', 'best'].forEach(function(field) {
                            if(trainData.hasOwnProperty(field)) {
                                var value = trainData[field];
                                //console.log('_update', trainData, field);
                                value && train._elem(field + '-value')
                                    .toggleMod('hidden', true, value === '0ms')
                                    ._elem('value').domElem.text(
                                        value.toPrecision?
                                            value.toPrecision(7) :
                                            value);
                            }
                        });

                });

                $.each(data, function(trainId, data) {
                    _this._getTrain(trainId, data);
                });
            },

            _getTrain : function(trainId, data) {
                if(trains[trainId]) return trains[trainId];

                bemDom.append(this._elem('trains').domElem, BEMHTML.apply({
                    block : 'legend',
                    elem : 'train',
                    elemMods : { color : colors.string2colorId(trainId) },
                    content : [
                        {
                            elem : 'train-name',
                            content : {
                                block : 'checkbox',
                                mods : { theme : 'islands', size : 'm', checked : true },
                                name : trainId,
                                text : [
                                    trainId,
                                    { html : ' &nbsp; ' },
                                    {
                                        block : 'legend',
                                        elem : 'time-left-value',
                                        elemMods : { hidden : !data['time-left'] || data['time-left'] === '0ms' },
                                        content : data['time-left']
                                    },
                                    { html : ' &nbsp; ' },
                                    {
                                        block : 'legend',
                                        elem : 'best-value',
                                        elemMods : { hidden : !data.best },
                                        content : data.best && data.best
                                    }
                                ]
                            }
                        },
                        {
                            elem : 'values',
                            content : [
                                {
                                    elem : 'test-value',
                                    elemMods : { hidden : !data.test },
                                    content : data.test && data.test.toPrecision(7)
                                },
                                {
                                    elem : 'learn-value',
                                    elemMods : { hidden : !data.learn },
                                    content : data.learn && data.learn.toPrecision(7)
                                },
                                {
                                    elem : 'time-spend-value',
                                    elemMods : { hidden : !data['time-spend'] },
                                    content : data['time-spend']
                                }
                            ]
                        }
                    ]
                }));

                var trainElems = this.findChildElems('train');

                return trains[trainId] = trainElems.get(trainElems.size() - 1);
            }
        }));

    });
