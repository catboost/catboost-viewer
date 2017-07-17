modules.define('charts__smoothing',
    ['i-bem-dom', 'input', 'button'],
    function(provide, bemDom, Input, Button) {

        var ALLOWED_REGEX = /^(0(\.(\d{1,2})?)?|1)$/;

        provide(bemDom.declBlock(this.name, {
            onSetMod : {
                'js' : {
                    'inited' : function() {
                        (this._buttons = this.findChildBlocks(Button)).forEach(function(button) {
                            this._events(button).on('click', this._onButtonClick);
                        }, this);

                        var input = this._input = this.findChildBlock(Input);
                        this.setVal(input.getVal());
                        this._events(input).on('change', this._onInputChange);
                    }
                }
            },

            _onInputChange : function(e, data) {
                var input = e.bemTarget,
                    val = e.bemTarget.getVal();

                val && (ALLOWED_REGEX.test(val)?
                    this.setVal(val, data) :
                    input.setVal(this.getVal(), data));
            },

            _onButtonClick : function(e) {
                var oldVal = this.getVal();
                this.setVal(
                    (e.bemTarget === this._buttons.get(1)?
                        Math.min(oldVal + 0.1, 1):
                        Math.max(oldVal - 0.1, 0))
                            .toFixed(1));
            },

            getVal : function() {
                return this._val;
            },

            setVal : function(val, data) {
                val = parseFloat(val, 10) || 0;

                if(this._val !== val) {
                    this._input.setVal(this._val = val);

                    this._buttons.forEach(function(button, i) {
                        button.setMod('disabled', i === val);
                    });

                    this._emit('change', data);
                }

                return this;
            }
        }));

    });

