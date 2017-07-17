[{
    shouldDeps : [
        { block : 'checkbox', mods : { theme : 'islands', size : 'm' } },
        {
            block : 'icon',
            mods : {
                glyph : [
                    'minus',
                    'ellipsis-h',
                    'clock-o',
                    'star'
                ]
            }
        },
        'colors'
    ]
}, {
    tech : 'js',
    mustDeps : [
        { tech : 'bemhtml', block : 'legend' },
        { tech : 'bemhtml', block : 'charts' },
        { tech : 'bemhtml', block : 'checkbox', mods : { theme : 'islands', size : 'm' } },
        { tech : 'bemhtml', block : 'icon', mods : { glyph : ['minus', 'ellipsis-h', 'clock-o'] } }
    ]
}]
