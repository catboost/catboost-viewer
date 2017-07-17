modules.define('colors', function(provide) {
    var colorIdByString = {},
        colorId = 0;

    provide({
        colors : [
            '#8fd541',
            '#9e64a9',
            '#72c3e0',
            '#fe8c00',
            '#5bcd9d',
            '#7f7f7f',
            '#fc6767',
            '#6d64a9'
        ],

        string2colorId : function(str) {
            return colorIdByString[str] || (colorIdByString[str] = String(colorId++));
        },

        string2color : function(str) {
            return this.colors[this.string2colorId(str)];
        }
    });
});
