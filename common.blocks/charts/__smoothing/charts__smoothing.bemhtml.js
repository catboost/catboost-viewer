block('charts').elem('smoothing')(
    js()(true),
    content()(function() {
        return [
            'Smoothing',
            {
                block : 'button',
                mods : { theme : 'islands', size : 's' },
                text : '-'
            },
            {
                block : 'input',
                mods : { theme : 'islands', size : 's' },
                val : '0'
            },
            {
                block : 'button',
                mods : { theme : 'islands', size : 's' },
                text : '+'
            }
        ];
    })
);
