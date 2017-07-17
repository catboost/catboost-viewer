block('charts')(
    js()(true),
    content()({
        elem : 'header',
        content : [
            { elem : 'tabs' },
            {
                elem : 'options',
                content : [
                    { elem : 'smoothing' },
                    {
                        elem : 'y-axis-type',
                        content : {
                            block : 'checkbox',
                            mods : { theme : 'islands', size : 'm' },
                            name : 'logarithmic-y-axis',
                            text : 'Logarithmic y axis'
                        }
                    }
                ]
            }
        ]
    })
);
