var fs = require('fs');
var browserify = require('browserify');
var watchify = require('watchify');
var liveServer = require("live-server");
var tsify = require('tsify');

var b = browserify({
  entries: ['src/index.ts'],
  // delay: 100,
  // ignoreWatch: ['**/node_modules/**'],
  // poll: false
  cache: {},
  packageCache: {},
  plugin: [watchify]
});
b.on('update', bundle)
    .plugin(tsify, { target: 'es6', noImplicitAny: true })
    .transform("babelify", { extensions: [ '.tsx', '.ts' ] })
    .add('src/index.ts');
bundle();

function bundle() {
  console.log("update ......")
  b.bundle()
    .on('error', console.error)
    .pipe(fs.createWriteStream('public/index.js'))
  ;
}

var params = {
    port: 8181, // Set the server port. Defaults to 8080.
    host: "0.0.0.0", // Set the address to bind to. Defaults to 0.0.0.0 or process.env.IP.
    root: "./public", // Set root directory that's being served. Defaults to cwd.
    open: false, // When false, it won't load your browser by default.
    ignore: 'scss,./node_modules', // comma-separated string for paths to ignore
    file: "index.html", // When set, serve this file (server root relative) for every 404 (useful for single-page applications)
    wait: 1000, // Waits for all changes, before reloading. Defaults to 0 sec.
    mount: [['/components', './node_modules']], // Mount a directory to a route.
    logLevel: 2, // 0 = errors only, 1 = some, 2 = lots
    middleware: [function(req, res, next) { next(); }] // Takes an array of Connect-compatible middleware that are injected into the server middleware stack
};
liveServer.start(params);
