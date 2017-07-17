[{
    shouldDeps : [
        { block : 'functions', elem : 'debounce' },
        { block : 'link', mods : { theme : 'islands', pseudo : true } },
        { block : 'icon', mods : { glyph : ['chevron-up', 'chevron-down'] } },
        { block : 'checkbox', mods : { theme : 'islands', size : 'm' } },
        { elem : 'smoothing' },
        'plotly',
        'colors'
    ]
}, {
    tech : 'js',
    mustDeps : { tech : 'bemhtml', block : 'charts' }
}]
