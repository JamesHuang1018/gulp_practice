const gulp = require("gulp");
var browserify = require("browserify"); //轉譯瀏覽器的語言
var tsify = require("tsify"); //browserify插件，轉換ts語法用
var watchify = require("watchify"); //browserify插件，監控用
var source = require("vinyl-source-stream"); //轉換gulp懂得Vinyl Stream
var buffer = require("vinyl-buffer"); //轉換gulp懂得Vinyl Buffer
var fancy_log = require("fancy-log"); //紀錄log用
var uglify = require("gulp-uglify"); //壓縮js
var minifyCSS = require("gulp-minify-css"); //壓縮css
var sourcemaps = require("gulp-sourcemaps"); //轉換map
var args = require("yargs").argv; //抓取command line指令
var rename = require("gulp-rename"); //重編檔案名稱
var plumber = require("gulp-plumber"); //紀錄log用
var glob = require("glob"); //匹配檔案
var clean = require("gulp-clean"); //清除檔案
var concat = require("gulp-concat"); //合併檔案
var browserSync = require("browser-sync").create();
var { srcPath, distPath, nodePath, config } = require("./config");

function buildTS(file, isWatchify, watchBrowserify) {
    const path =
            file ||
            (() => {
                throw new Error("尚未指定轉換的檔案路徑");
            })(),
        outputPath = path.split("/").slice(0, -1).join("/"),
        fileName = path.split("/").reverse()[0];

    config.browserify.entries = file;

    let b = watchBrowserify || browserify(config.browserify).plugin(tsify);

    if (isWatchify) {
        b = watchify(b, config.watchify);

        console.log("use watchify");

        b.on("update", buildTS.bind(null, file, false, b));
        b.on("log", fancy_log);
    }

    console.log(
        `build info: path=> ${path}, fileName=> ${fileName},isWatchify=>${isWatchify}`
    );

    return b
        .transform("babelify", config.babel)
        .bundle()
        .on("error", console.error)
        .pipe(source("bundle.js"))
        .pipe(plumber())
        .pipe(buffer())
        .pipe(
            rename(function (path) {
                path.basename = fileName.replace(".ts", "");
                path.extname = ".bundle.js";
            })
        )
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(uglify())
        .pipe(sourcemaps.write("./"))
        .pipe(plumber.stop())
        .pipe(gulp.dest(`${distPath}/${outputPath}`))
        .pipe(browserSync.stream());
}

function cleanFile() {
    return gulp
        .src(distPath, {
            read: false,
            allowEmpty: true,
        })
        .pipe(clean());
}

function dev() {
    const filePath =
        args.file ||
        (() => {
            throw new Error("尚未指定轉換的檔案路徑");
        })();

    config.TS.src.push(`!${srcPath}/${filePath}`);

    const watcher = gulp.watch(config.TS.src);

    watcher.on("change", function (path, stats) {
        console.log(`watcher path:${path}`);

        buildTS(path.replace("\\", "/").replace(config.TS.baseDir, ""), false);
    });

    return buildTS(filePath, true);
}

function watchs(done) {
    gulp.watch(config.html.src).on("change", browserSync.reload);

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
            buildTS(x.replace(config.TS.baseDir, ""), false);
        });
    });
}

function vendorsJs() {
    return gulp
        .src(config.vendors.js)
        .pipe(plumber())
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(concat(config.vendors.concatJs))
        .pipe(uglify())
        .pipe(sourcemaps.write("./"))
        .pipe(plumber.stop())
        .pipe(gulp.dest(config.vendors.distJS));
}

function vendorsCss() {
    return gulp
        .src(config.vendors.css)
        .pipe(plumber())
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(concat(config.vendors.concatCss))
        .pipe(
            minifyCSS({
                keepBreaks: true,
            })
        )
        .pipe(sourcemaps.write("./"))
        .pipe(plumber.stop())
        .pipe(gulp.dest(config.vendors.distCss));
}

exports.default = gulp.series(serve, gulp.parallel(dev, watchs));

exports.build = gulp.series(
    cleanFile,
    gulp.parallel(buildFile, vendorsJs, vendorsCss)
);
