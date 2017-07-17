block('legend')(
    js()(true),
    content()([
        {
            elem : 'learn-test',
            content : [
                {
                    elem : 'test',
                    content : {
                        block : 'checkbox',
                        mods : {
                            theme : 'islands',
                            size : 'm',
                            checked : true
                        },
                        name : 'test',
                        text : [
                            { block : 'icon', mods : { glyph : 'minus' } },
                            ' Test'
                        ]
                    }
                },
                {
                    elem : 'learn',
                    content : {
                        block : 'checkbox',
                        mods : {
                            theme : 'islands',
                            size : 'm',
                            checked : true
                        },
                        name : 'learn',
                        text : [
                            { block : 'icon', mods : { glyph : 'ellipsis-h' } },
                            ' Learn'
                        ]
                    }
                }
            ]
        },
        { elem : 'trains' }
    ]),

    elem('time-left-value')(
        tag()('span'),
        addAttrs()({ title : 'Time left' }),
        content()(function() {
            return [
                { block : 'icon', mods : { glyph : 'clock-o' } },
                ' ',
                { elem : 'value', content : applyNext() }
            ];
        })
    ),

    elem('learn-value')(
        addAttrs()({ title : 'Learn' }),
        content()(function() {
            return [
                { block : 'icon', mods : { glyph : 'ellipsis-h' } },
                ' ',
                { elem : 'value', content : applyNext() }
            ];
        })
    ),

    elem('test-value')(
        addAttrs()({ title : 'Test' }),
        content()(function() {
            return [
                { block : 'icon', mods : { glyph : 'minus' } },
                ' ',
                { elem : 'value', content : applyNext() }
            ];
        })
    ),

    elem('time-spend-value')(
        addAttrs()({ title : 'Time spend' }),
        content()(function() {
            return [
                { block : 'icon', mods : { glyph : 'clock-o' } },
                ' ',
                { elem : 'value', content : applyNext() }
            ];
        })
    ),

    elem('best-value')(
        tag()('span'),
        addAttrs()({ title : 'Best' }),
        content()(function() {
            return [
                { block : 'icon', mods : { glyph : 'star' } },
                ' ',
                { elem : 'value', content : applyNext() }
            ];
        })
    ),

    elem('value').tag()('span')
);
