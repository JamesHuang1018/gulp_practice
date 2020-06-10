const gulp = require('gulp');
var browserify = require('browserify'); //轉譯瀏覽器的語言
var tsify = require('tsify'); //browserify插件，轉換ts語法用
var watchify = require('watchify'); //browserify插件，監控用
var source = require('vinyl-source-stream'); //轉換gulp懂得Vinyl Stream
var buffer = require('vinyl-buffer'); //轉換gulp懂得Vinyl Buffer
var fancy_log = require('fancy-log'); //紀錄log用
var uglify = require('gulp-uglify'); //壓縮js
var minifyCSS = require('gulp-minify-css'); //壓縮css
var sourcemaps = require('gulp-sourcemaps'); //轉換map
var args = require('yargs').argv; //抓取command line指令
var rename = require('gulp-rename'); //重編檔案名稱
var plumber = require('gulp-plumber'); //紀錄log用
var glob = require('glob'); //匹配檔案
var clean = require('gulp-clean'); //清除檔案
var concat = require('gulp-concat'); //合併檔案
var browserSync = require('browser-sync').create();
var eslint = require('gulp-eslint');
var babel = require('gulp-babel'); //JS轉譯

var { srcPath, distPath, nodePath, config } = require('./config');

const buildTS = function (file, isWatchify, watchBrowserify) {
    const path =
        file ||
        (() => {
          throw new Error('尚未指定轉換的檔案路徑');
        })(),
      outputPath = path.split('/').slice(0, -1).join('/'),
      fileName = path.split('/').reverse()[0];

    config.browserify.entries = file;

    let b = watchBrowserify || browserify(config.browserify).plugin(tsify);

    if (isWatchify) {
      b = watchify(b, config.watchify);

      fancy_log.info('\x1b[32m', 'use watchify');

      b.on('update', buildTS.bind(null, file, false, b));
      b.on('log', fancy_log);
    }

    fancy_log.info('\x1b[32m', `build info: path=> ${path}, fileName=> ${fileName},isWatchify=>${isWatchify}`);

    return b
      .transform('babelify', config.babel)
      .bundle()
      .on('error', function (err) {
        fancy_log.error('\x1b[31m', err);
      })
      .pipe(source('bundle.js'))
      .pipe(plumber())
      .pipe(buffer())
      .pipe(
        rename(function (path) {
          path.basename = fileName.replace('.ts', '');
          path.extname = '.bundle.js';
        })
      )
      .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(uglify())
      .pipe(sourcemaps.write('./'))
      .pipe(plumber.stop())
      .pipe(gulp.dest(`${distPath}/${outputPath}`))
      .pipe(browserSync.stream());
  },
  lint = function (file) {
    return gulp.src(file).pipe(eslint()).pipe(eslint.format()).pipe(eslint.failOnError());
  },
  bundleJs = function (paths, bundelName) {
    return gulp
      .src(paths)
      .pipe(babel({ presets: config.babel.presets, compact: false })) //在bundle JS時，需要再用babel轉譯過 (與babelify意思一樣，但參數設定不同，所以在config抓取部分獨立抓出presets)
      .pipe(plumber())
      .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(concat(bundelName)) //合併指定檔案
      .pipe(uglify())
      .pipe(sourcemaps.write('./'))
      .pipe(plumber.stop())
      .pipe(gulp.dest(config.vendors.distJS));
  },
  bundleCss = function (paths, bundelName) {
    return gulp
      .src(paths)
      .pipe(plumber())
      .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(concat(bundelName))
      .pipe(minifyCSS())
      .pipe(sourcemaps.write('./'))
      .pipe(plumber.stop())
      .pipe(gulp.dest(config.vendors.distCss));
  },
  bundleVendors = gulp.parallel(
    function () {
      return bundleJs(config.vendors.js, config.vendors.jsName);
    },
    function () {
      return bundleCss(config.vendors.css, config.vendors.cssName);
    }
  ),
  bundleCommons = gulp.parallel(
    function () {
      return bundleJs(config.commons.js, config.commons.jsName);
    },
    function () {
      return bundleCss(config.commons.css, config.commons.cssName);
    }
  );

function dev() {
  const filePath =
    args.file ||
    (() => {
      throw new Error('尚未指定轉換的檔案路徑');
    })();

  const watcher = gulp.watch(config.TS.src.concat([`!${srcPath}/${filePath}`]));

  watcher.on('change', function (path, stats) {
    fancy_log.info('\x1b[32m', `watcher path:${path}`);
    buildTS(path.replace('\\', '/').replace(config.TS.baseDir, ''), false);
  });

  return buildTS(filePath, true);
}

function watchs(done) {
  gulp.watch(config.html.src).on('change', browserSync.reload);
  gulp.watch(config.TS.src).on('change', function (file) {
    return lint(file);
  });
  done();
}

function serve(done) {
  browserSync.init(config.browserSync);

  done();
}

function buildFile() {
  return glob(config.TS.buildDir, function (er, files) {
    if (er) {
      done(er);
    }
    files.forEach((x) => {
      buildTS(x.replace(config.TS.baseDir, ''), false);
    });
  });
}

function lintAll() {
  return lint(config.TS.src);
}

function cleanFile() {
  return gulp
    .src(distPath, {
      read: false,
      allowEmpty: true,
    })
    .pipe(clean());
}

exports.default = gulp.series(lintAll, gulp.parallel(dev, watchs), serve);

exports.build = gulp.series(lintAll, cleanFile, gulp.parallel(buildFile, bundleVendors, bundleCommons));

exports.vendors = gulp.series(cleanFile, gulp.parallel(bundleVendors, bundleCommons));
