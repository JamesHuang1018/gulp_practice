const basePath = ".",
    srcPath = "./src",
    distPath = "./dist",
    nodePath = "./node_modules";

let envConfig = {
    browserSync: {
        server: {
            baseDir: basePath,
        },
        port: 8080,
    },
    browserify: {
        basedir: srcPath,
        debug: true,
        cache: {},
        packageCache: {},
    },
    watchify: {
        delay: 100,
        ignoreWatch: ["**/node_modules/**"],
        poll: false,
    },
    html: {
        src: [`${basePath}/**/*.html`],
    },
    TS: {
        baseDir: "src/",
        src: [`${srcPath}/**/*.ts`],
        buildDir: `${srcPath}/**/*.ts`,
    },
    vendors: {
        js: [
            `${srcPath}/main.ts`,
            `${srcPath}/test.ts`, // 已包含 popper.js
        ],
        css: [`${srcPath}/c1.css`, `${srcPath}/c2.css`],
        concatJs: "vendors.js",
        concatCss: "vendors.css",
        distJS: `${distPath}/assets/js`,
        distCss: `${distPath}/assets/css`,
    },
};

// exports default envConfig;

exports.srcPath = srcPath;

exports.distPath = distPath;

exports.nodePath = nodePath;

exports.config = envConfig;
