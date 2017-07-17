# livereload

Livereload is built on top of https://github.com/mklabs/tiny-lr.

## How it works
1. Template injects a [script](https://github.com/livereload/livereload-js) which is served by `tiny-lr` middleware.
2. The script connects to `tiny-lr` server via WS.
3. The server watches for changes of built files via `chokidar` and send commands to update styles or refresh the page via WS.

The template is collected by `page` block dependencies.
`tiny-lr` server starts only in dev mode.
