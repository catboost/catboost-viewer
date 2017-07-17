block('page-index')(
    js()(true),
    content()(function() {
        return [
            {
                block : 'sideblock',
                mods : { position : 'left' }
                //content : {
                    //elem : 'source-dir',
                    //content : 'Source dir: ' + this.sourceDir
                //}
            },
            { block : 'charts', mods : { position : 'right' } }
        ];
    })
);
