"use strict";

const { series, src, dest, parallel, watch } = require("gulp");
const autoprefixer = require("gulp-autoprefixer");
const babel = require('gulp-babel');
const browsersync = require("browser-sync");
const concat = require("gulp-concat");
const CleanCSS = require("gulp-clean-css");
const del = require("del");
const fileinclude = require("gulp-file-include");
const imagemin = require("gulp-imagemin");
const inquirer = require("inquirer");
const npmdist = require("gulp-npm-dist");
const newer = require("gulp-newer");
const rename = require("gulp-rename");
const rtlcss = require("gulp-rtlcss");
const sourcemaps = require("gulp-sourcemaps");
const sass = require("gulp-sass")(require("sass"));
const uglify = require("gulp-uglify");


const paths = {
    baseSrc: "src/",                // source directory
    baseSrcAssets: "src/assets/",   // source assets directory
    baseDist: "dist/",              // build directory
    baseDistAssets: "dist/assets/", // build assets directory
};

var demoPath = "saas";

const clean = function (done) {
    del.sync(paths.baseDist, done());
};


const vendor = function () {

    // vendor.min.css
    const outCSS = paths.baseDist + demoPath + "/assets/css/";

    src([
        "./node_modules/select2/dist/css/select2.min.css",
        "./node_modules/daterangepicker/daterangepicker.css",
        "./node_modules//bootstrap-touchspin/dist/jquery.bootstrap-touchspin.min.css",
        "./node_modules/bootstrap-datepicker/dist/css/bootstrap-datepicker.min.css",
        "./node_modules/bootstrap-timepicker/css/bootstrap-timepicker.min.css",
        "./node_modules/flatpickr/dist/flatpickr.min.css",
    ])
        .pipe(concat("vendor.css"))
        .pipe(CleanCSS())
        .pipe(rename({ suffix: ".min" }))
        .pipe(dest(outCSS));

    const outJs = paths.baseDist + demoPath + "/assets/js/";

    // vendor.min.js
    src([
        "./node_modules/jquery/dist/jquery.min.js",
        "./node_modules/bootstrap/dist/js/bootstrap.bundle.js",
        "./node_modules/simplebar/dist/simplebar.min.js",
        "./node_modules/lucide/dist/umd/lucide.min.js",

        "./node_modules/select2/dist/js/select2.min.js",
        "./node_modules/daterangepicker/moment.min.js",
        "./node_modules/daterangepicker/daterangepicker.js",
        "./node_modules/bootstrap-datepicker/dist/js/bootstrap-datepicker.min.js",
        "./node_modules/bootstrap-timepicker/js/bootstrap-timepicker.min.js",
        "./node_modules/jquery-mask-plugin/dist/jquery.mask.min.js",
        "./node_modules/bootstrap-touchspin/dist/jquery.bootstrap-touchspin.min.js",
        "./node_modules/bootstrap-maxlength/dist/bootstrap-maxlength.min.js",
        "./node_modules/handlebars/dist/handlebars.min.js",
        "./node_modules/typeahead.js/dist/typeahead.bundle.min.js",
        "./node_modules/flatpickr/dist/flatpickr.min.js",
    ])


        .pipe(concat("vendor.js"))
        .pipe(uglify())
        .pipe(rename({ suffix: ".min" }))
        .pipe(dest(outJs));

    const out = paths.baseDist + demoPath + "/assets/vendor/";
    return src(npmdist(), { base: "./node_modules" })
        .pipe(rename(function (path) {
            path.dirname = path.dirname.replace(/\/dist/, '').replace(/\\dist/, '');
        }))
        .pipe(dest(out));
};

const html = function () {
    const srcPath = paths.baseSrc + demoPath + "/";
    const out = paths.baseDist + demoPath + "/";
    return src([
        srcPath + "*.html",
        srcPath + "*.ico", // favicon
        srcPath + "*.png",
    ])
        .pipe(
            fileinclude({
                prefix: "@@",
                basepath: "@file",
                indent: true,
            })
        )
        .pipe(dest(out));
};

const data = function () {
    const out = paths.baseDist + demoPath + "/assets/data/";
    return src([paths.baseSrcAssets + "data/**/*"])
        .pipe(dest(out));
};

const fonts = function () {
    const out = paths.baseDist + demoPath + "/assets/fonts/";
    return src([paths.baseSrcAssets + "fonts/**/*"])
        .pipe(newer(out))
        .pipe(dest(out));
};

const images = function () {
    var out = paths.baseDist + demoPath + "/assets/images";
    return src(paths.baseSrcAssets + "images/**/*")
        .pipe(newer(out))
        // .pipe(imagemin())
        .pipe(dest(out));
};

const javascript = function () {
    const out = paths.baseDist + demoPath + "/assets/js/";

    // copying and minifying all other js
    src([paths.baseSrcAssets + "js/**/*.js", "!" + paths.baseSrcAssets + "js/hyper-layout.js", "!" + paths.baseSrcAssets + "js/hyper-main.js"])
        .pipe(uglify())
        // .pipe(rename({ suffix: ".min" }))
        .pipe(dest(out));

    // app.js (hyper-main.js + hyper-layout.js)
    return src([paths.baseSrcAssets + "js/hyper-main.js", paths.baseSrcAssets + "js/hyper-layout.js"])
        .pipe(concat("app.js"))
        .pipe(dest(out))
        .pipe(babel({
            presets: ['@babel/env']
        }))
        .pipe(uglify())
        .pipe(rename({ suffix: ".min" }))
        .pipe(dest(out));
};

// CSS
const scss = function () {
    const out = paths.baseDist + demoPath + "/assets/css/";

    src(paths.baseSrcAssets + `scss/app-${demoPath}.scss`)
        .pipe(sourcemaps.init())
        .pipe(sass.sync().on('error', sass.logError)) // scss to css
        .pipe(
            autoprefixer({
                overrideBrowserslist: ["last 2 versions"],
            })
        )
        .pipe(dest(out))  // app.css
        .pipe(CleanCSS())
        .pipe(rename({ suffix: ".min" })) // app.min.css
        .pipe(sourcemaps.write("./")) // source maps
        .pipe(dest(out));

    // Generate RTL
    return src(paths.baseSrcAssets + `scss/app-${demoPath}.scss`)
        .pipe(sourcemaps.init())
        .pipe(sass.sync().on('error', sass.logError)) // scss to css
        .pipe(
            autoprefixer({
                overrideBrowserslist: ["last 2 versions"],
            })
        )
        .pipe(rtlcss())
        .pipe(rename({ suffix: "-rtl" }))
        .pipe(dest(out))
        .pipe(CleanCSS())
        .pipe(rename({ suffix: ".min" }))
        .pipe(sourcemaps.write("./")) // source maps
        .pipe(dest(out));
};

// Icons 
const icons = function () {
    const out = paths.baseDist + demoPath + "/assets/css/";
    return src(paths.baseSrcAssets + "scss/icons.scss")
        .pipe(sourcemaps.init())
        .pipe(sass.sync().on('error', sass.logError)) // scss to css
        .pipe(
            autoprefixer({
                overrideBrowserslist: ["last 2 versions"],
            })
        )
        .pipe(dest(out))
        .pipe(CleanCSS())
        .pipe(rename({ suffix: ".min" }))
        .pipe(sourcemaps.write("./")) // source maps
        .pipe(dest(out));
};


// live browser loading
const initBrowserSync = function (done) {
    const startPath = "/index.html";
    browsersync.init({
        startPath: startPath,
        server: {
            baseDir: paths.baseDist + demoPath + "/",
            middleware: [
                function (req, res, next) {
                    req.method = "GET";
                    next();
                },
            ],
        },
    });
    done();
}

const reloadBrowserSync = function (done) {
    browsersync.reload();
    done();
}

function watchFiles() {
    watch(paths.baseSrc + "**/*.html", series(html, reloadBrowserSync));
    watch(paths.baseSrcAssets + "data/**/*", series(data, reloadBrowserSync));
    watch(paths.baseSrcAssets + "fonts/**/*", series(fonts, reloadBrowserSync));
    watch(paths.baseSrcAssets + "images/**/*", series(images, reloadBrowserSync));
    watch(paths.baseSrcAssets + "js/**/*", series(javascript, reloadBrowserSync));
    watch(paths.baseSrcAssets + "scss/icons.scss", series(icons, reloadBrowserSync));
    watch([paths.baseSrcAssets + "scss/**/*.scss", "!" + paths.baseSrcAssets + "scss/icons.scss"], series(scss, reloadBrowserSync));
}

// dist clean Tasks
exports.clean = series(
    clean,
);

// Production Tasks
exports.default = series(
    html,
    vendor,
    parallel(data, fonts, images, javascript, scss, icons),
    parallel(watchFiles, initBrowserSync)
);


// Build Tasks
exports.build = series(
    clean,
    html,
    vendor,
    parallel(data, fonts, images, javascript, scss, icons)
);