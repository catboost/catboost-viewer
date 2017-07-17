modules.define('page-index',
    ['i-bem-dom', 'checkbox', 'BEMHTML'],
    function(provide, bemDom, Checkbox, BEMHTML) {

        provide(bemDom.declBlock(this.name, {
            onSetMod : {
                'js' : {
                    'inited' : function() {
                    }
                }
            }
        }));

    });
