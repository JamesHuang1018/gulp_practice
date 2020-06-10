const basePath = '.',
  srcPath = './src',
  distPath = './dist',
  nodePath = './node_modules';

let envConfig = {
  babel: {
    presets: [
      [
        '@babel/preset-env', //通用轉譯，依據指定的流覽器版本，自動偵測轉譯的es版本
        {
          targets: {
            browsers: ['> 1%', 'last 2 versions', 'not ie <= 8'],
          },
          useBuiltIns: 'entry', //polyfill載入方式
          corejs: '3.0.0', //指定的core.js版本(跟polyfill轉譯有關)
        },
      ],
    ],
    extensions: ['.ts'],
  },
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
    ignoreWatch: ['**/node_modules/**'],
    poll: false,
  },
  html: {
    src: [`${basePath}/**/*.html`],
  },
  TS: {
    baseDir: 'src/',
    src: [`${srcPath}/**/*.ts`],
    buildDir: `${srcPath}/**/*.ts`,
  },
  vendors: {
    js: [`${srcPath}/jquery/jquery-3.3.1.js`, `${srcPath}/bootstrap/bootstrap.bundle.js`],
    css: [`${srcPath}/bootstrap/bootstrap.css`, `${srcPath}/fontawesome/all.css`],
    jsName: 'vendors.js',
    cssName: 'vendors.css',
    distJS: `${distPath}/assets/js`,
    distCss: `${distPath}/assets/css`,
  },
  commons: {
    js: [`${srcPath}/i18next/i18next-ko.js`],
    css: [`${srcPath}/bootstrap/custom.css`],
    jsName: 'commons.js',
    cssName: 'commons.css',
    distJS: `${distPath}/assets/js`,
    distCss: `${distPath}/assets/css`,
  },
};

// exports default envConfig;

exports.srcPath = srcPath;

exports.distPath = distPath;

exports.nodePath = nodePath;

exports.config = envConfig;
