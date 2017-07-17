# CatBoost Viewer

## Installation

You need Node.js and NPM installed.
You can do this from [download](https://nodejs.org/en/download/) or [by package manager](https://nodejs.org/en/download/package-manager/).

```sh
npm i -g catboost-viewer
```

After that you will get globally installed `catboost-viewer` executable.

## Usage

```sh
catboost-viewer path/to/catboost/files
```

Navigate to [http://localhost:3000](http://localhost:3000).

## Development

Powered by [bem-express](https://github.com/bem/bem-express/).

Get sources:
```sh
git clone https://github.com/catboost/catboost-viewer.git
cd catboost-viewer
npm i
```

```sh
CATBOOST_DIR=path/to/catboost/files npm run dev
```
will run initial `enb make` command and then start the server with `nodemon` which will restart it on any server file update. Also `chokidar` will watch for changes in `*.blocks/**` and rebuild the project automatically. Then livereload will update the page in the browser.

You may also set `NO_LIVERELOAD` env variable to switch livereload off:
```sh
NO_LIVERELOAD=1 CATBOOST_DIR=path/to/catboost/files npm run dev
```

You may also run rebuild manually with `enb make` or with external watcher (e.g. `npm run watch`). To switch off automatic rebuild use `NO_AUTOMAKE` env variable:
```sh
NO_AUTOMAKE=1 CATBOOST_DIR=path/to/catboost/files npm run dev
```

### Mocking files

If you need to mock files which are continuously written (as in CatBoost train process):
```sh
node tests/mock-running.js source/dir/with/catboost/files target/dir
```

Then run with created dir:
```sh
CATBOOST_DIR=target/dir npm run dev
```

### Tips

Run server in dev mode with `NODE_ENV=development` environment variable (`nodemon` will set it for you).

In dev mode

* Add `?json=1` to URL to see raw data
* Add `?bemjson=1` to URL to see BEMJSON generated with BEMTREE templates.

## Production

```sh
YENV=production enb make
NODE_ENV=production CATBOOST_DIR=path/to/catboost/files node server
```
