// including plugins
const gulp = require('gulp')
const minifyCSS = require('gulp-clean-css')
const autoprefixer = require('gulp-autoprefixer')
const gp_concat = require('gulp-concat')
const gp_rename = require('gulp-rename')
const gp_uglify = require('gulp-uglify')
const clean = require('gulp-clean')
const to5 = require('gulp-6to5')
const path = require('path')

// Add CSS files
gulp.task('css', function(){
    return gulp.src(
            [
                './public/css/bootstrap.css',
                './public/css/style.css',
                './public/css/colors/cyan.css',
                './public/css/summernote.min.css',
                './public/css/custom.css'
            ]
        )
        .pipe(minifyCSS())
        .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9'))
        .pipe(gp_concat('style.min.css'))
        .pipe(gulp.dest('./public/dist/css/'))
})

// When using a theme, usuually there is a fonts
// directory that should be copied to dist
gulp.task('copy-fonts', function(){
    return gulp.src(
            [
                './public/fonts/**'
            ]
        )
        .pipe(gulp.dest('./public/dist/fonts/'))
})

gulp.task('copy-summernote', function(){
    return gulp.src(
            ['./public/css/font/**']
        )
        .pipe(gulp.dest('./public/dist/css/font/'))
})

gulp.task('style', ['css', 'copy-fonts', 'copy-summernote'], function(){})

// Add javascript files here
gulp.task('vendor', function(){
    return gulp.src(
            [
                './public/scripts/jquery-2.2.0.min.js',
                './public/scripts/jquery-ui.min.js',
                './public/scripts/bootstrap.min.js',
                './public/scripts/mmenu.min.js',
                './public/scripts/chosen.min.js',
                './public/scripts/slick.min.js',
                './public/scripts/rangeslider.min.js',
                './public/scripts/magnific-popup.min.js',
                './public/scripts/waypoints.min.js',
                './public/scripts/counterup.min.js',
                './public/scripts/tooltips.min.js',
                './public/js/mustache.js',
                './public/js/dropzone.js',
                './public/js/summernote.min.js',
                './public/js/summernote-example.js',
                './public/scripts/custom.js',
                './public/scripts/auth.js',
                './public/scripts/ssl.js'
            ]
        )
        .pipe(gp_concat('vendor.min.js'))
        .pipe(gulp.dest('./public/dist/js/'))
        .pipe(gp_rename('vendor.min.js'))
        .pipe(gp_uglify())
        .pipe(gulp.dest('./public/dist/js/'))
});

gulp.task('revolution', function(){
    return gulp.src(
            [
                './public/scripts/extensions/revolution.extension.carousel.min.js',
                './public/scripts/extensions/revolution.extension.kenburn.min.js',
                './public/scripts/extensions/revolution.extension.layeranimation.min.js',
                './public/scripts/extensions/revolution.extension.migration.min.js',
                './public/scripts/extensions/revolution.extension.navigation.min.js',
                './public/scripts/extensions/revolution.extension.parallax.min.js',
                './public/scripts/extensions/revolution.extension.slideanims.min.js',
                './public/scripts/extensions/revolution.extension.video.min.js'
            ]
        )
        .pipe(gp_concat('revolution.min.js'))
        .pipe(gulp.dest('./public/dist/js/'))
        .pipe(gp_rename('revolution.min.js'))
        .pipe(gp_uglify())
        .pipe(gulp.dest('./public/dist/js/'))
});

gulp.task('home', function(){
    return gulp.src(
            [
                './public/js/home.js'
            ]
        )
        .pipe(gp_concat('home.min.js'))
        .pipe(gulp.dest('./public/dist/js/'))
        .pipe(gp_rename('home.min.js'))
        .pipe(gp_uglify())
        .pipe(gulp.dest('./public/dist/js/'))
});

gulp.task('community', function(){
    return gulp.src(
            [
                './public/js/community.js'
            ]
        )
        .pipe(gp_concat('community.min.js'))
        .pipe(gulp.dest('./public/dist/js/'))
        .pipe(gp_rename('community.min.js'))
        .pipe(gp_uglify())
        .pipe(gulp.dest('./public/dist/js/'))
});

gulp.task('card', function(){
    return gulp.src(
            [
                './public/scripts/card.js'
            ]
        )
        .pipe(gp_concat('card.min.js'))
        .pipe(gulp.dest('./public/dist/js/'))
        .pipe(gp_rename('card.min.js'))
        .pipe(to5())
        .pipe(gp_uglify())
        .pipe(gulp.dest('./public/dist/js/'))
});

gulp.task('sidebar', function(){
    return gulp.src(
            [
                './public/scripts/sidebar.js'
            ]
        )
        .pipe(gp_concat('sidebar.min.js'))
        .pipe(gulp.dest('./public/dist/js/'))
        .pipe(gp_rename('sidebar.min.js'))
        .pipe(to5())
        .pipe(gp_uglify())
        .pipe(gulp.dest('./public/dist/js/'))
});

gulp.task('account', function(){
    return gulp.src(
            [
                './public/scripts/account.js'
            ]
        )
        .pipe(gp_concat('account.min.js'))
        .pipe(gulp.dest('./public/dist/js/'))
        .pipe(gp_rename('account.min.js'))
        .pipe(gp_uglify())
        .pipe(gulp.dest('./public/dist/js/'))
});

gulp.task('referrer', function(){
    return gulp.src(
            [
                './public/scripts/referrer.js'
            ]
        )
        .pipe(gp_concat('referrer.min.js'))
        .pipe(gulp.dest('./public/dist/js/'))
        .pipe(gp_rename('referrer.min.js'))
        .pipe(gp_uglify())
        .pipe(gulp.dest('./public/dist/js/'))
});

gulp.task('pages', ['home', 'community', 'card', 'sidebar', 'account', 'referrer', 'revolution'], function(){})

// copy public directory to CDN project:
gulp.task('copy-public', function(){
    return gulp.src(
            [
                './public/**',
                './public/**/**'
            ]
        )
        .pipe(gulp.dest('./cdn/public/'))
})

// clear out unnecessary directories in CDN folder:
gulp.task('clean', function() {
    return gulp.src(
            [
                './cdn/public/images',
                './cdn/public/assets'
            ],
            {read: false}
        )
        .pipe(clean())
})

gulp.task('js', ['vendor', 'pages'], function(){})

gulp.task('prod', ['style', 'js'], function(){})
