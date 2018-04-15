var gulp = require('gulp');
		clean = require('gulp-clean'),
		sass = require('gulp-sass'),
		sourcemaps = require('gulp-sourcemaps'),
		autoprefixer = require('gulp-autoprefixer'),
		plumber = require('gulp-plumber'),
		cssnano = require('gulp-cssnano'),
		svgmin = require('gulp-svgmin'),
		svgstore = require('gulp-svgstore'),
		svgfallback = require('gulp-svgfallback'),
		jshint = require('gulp-jshint'),
		stylish = require('jshint-stylish'),
		watch = require('gulp-watch'),
		rename = require('gulp-rename'),
		parker = require('gulp-parker'),
		uglify = require('gulp-uglify'),
		concat = require('gulp-concat'),
		handlebars = require('gulp-compile-handlebars'),
		rename = require('gulp-rename'),
		filelist = require('gulp-filelist'),
		fs = require('fs'),
		ts = require('gulp-typescript'),
		livereload = require('gulp-livereload'),
		imagemin = require('gulp-imagemin'),
		imageminPngquant = require('imagemin-pngquant'),
		imageminJpegcompress = require('imagemin-jpeg-recompress');

		basepaths = {
		        src: 'source',
		        dest: 'dist'
		    },

		    paths = {
		        js: {
		            src: basepaths.src + '/js',
		            dest: basepaths.dest + '/js',
		            node: 'node_modules'
		            // bower: 'bower_components'
		        },
						ts: {
		            src: basepaths.src + '/js/ts'
		        },
		        css: {
		            src: basepaths.src + '/sass',
		            dest: basepaths.dest
		        },
		        templates: {
		          src: basepaths.src + '/templates/',
		          dest: basepaths.dest + 'templates'
		        },
		        images: {
		            src: basepaths.src + '/img',
		            dest: basepaths.dest + '/img'
		        },
		        svgs: {
		            src: basepaths.src + '/svg',
		            dest: basepaths.dest + '/svg'
		        }
		    };



gulp.task("createFileIndex", function(){
		gulp.src([paths.templates.src + '/*.*'])
      .pipe(filelist('filelist.json', { flatten: true, removeExtensions: true }))
      .pipe(gulp.dest("./"))
			.pipe(livereload());
});

gulp.task('compile', function () {
	var templateList = JSON.parse(fs.readFileSync("./filelist.json", "utf8"));
	var templateData = {
		firstName: 'Bren',
		templates: templateList
	},
	options = {
		ignorePartials: true, //ignores the unknown footer2 partial in the handlebars template, defaults to false
		batch : [paths.templates.src + '/partials'],
		helpers : {
			capitals : function(str){
				return str.toUpperCase();
			}
		}
	}
	var doAllTemplates = function() {
		for (var i = 0; i <  templateList.length; i++) {
			compileTemplate(templateList[i]);
		}
	}
	var compileTemplate = function(templateName) {
		return gulp.src(paths.templates.src + templateName + '.handlebars')
			.pipe(handlebars(templateData, options))
			.pipe(rename(templateName + '.html'))
			.pipe(gulp.dest('dist'))
			.pipe(livereload())
	}
	doAllTemplates();
});

/*
 Styles - Clean
 */
gulp.task('clean-styles', function () {
    return gulp.src(['style.css', 'style.css.map'], {read: false})
        .pipe(clean());
});


/*
 Styles Task
 */
gulp.task('styles', ['clean-styles'], function() {
    gulp.src(paths.css.src + '/**/*.scss')
        .pipe(plumber({
            errorHandler: function(error) {
                console.log('Styles Error: ' + error.message);
                this.emit('end');
            }
        }))

        .pipe(sourcemaps.init())
        .pipe(sass())
        .pipe(autoprefixer('last 2 version'))
        .pipe(cssnano())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(paths.css.dest))
				.pipe(livereload());
});

gulp.task('clean-styles', function () {
    return gulp.src('style.css', {read: false})
        .pipe(clean());
});



/*
 Scripts - Clean
 */
gulp.task('clean-scripts', function () {
    return gulp.src(paths.js.dest + '/all.min.js', {read: false})
        .pipe(clean());
});

/*
 Scripts - Hint
 */
gulp.task('hint', ['clean-scripts'], function() {
    return gulp.src(paths.js.src + '/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'))
        .pipe(jshint.reporter('fail'));
});

/*
 * Scripts - copy vendor folder from source to public
 */
gulp.task('vendor', function () {
    return gulp.src(
        [
            paths.js.src + '/vendor/**/*.js',
            paths.js.src + '/vendor/**/*.swf'
        ])
        .pipe(plumber({
            errorHandler: function (error) {
                console.log('Scripts Error: ' + error.message);
                this.emit('end');
            }
        }))
        .pipe(gulp.dest(paths.js.dest));
});


/*
Scripts - Compile Typescript
*/

gulp.task('typescript', function () {
	// console.log(paths.ts.src + '/**/*.ts');
	// console.log(paths.ts.dest);
    gulp.src(paths.ts.src + '/**/*.ts')
        .pipe(ts({
            noImplicitAny: true
        }))

        .pipe(gulp.dest(paths.ts.src));
});


/*
 Scripts - Concat and Uglify
 */
gulp.task('scripts', ['hint','vendor'],  function() {
    gulp.src([
            paths.js.node + '/svg4everybody/dist/svg4everybody.min.js',
            paths.js.node + '/picturefill/dist/picturefill.min.js',
            paths.js.src + '/**/*.js',
            '!' + paths.js.src + '/vendor/**/*.js'
        ])
        .pipe(plumber({
            errorHandler: function(error) {
                console.log('Scripts Error: ' + error.message);
                this.emit('end');
            }
        }))
				.pipe(sourcemaps.init())
        .pipe(uglify({ mangle: false }))
				.pipe(concat('all.min.js'))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(paths.js.dest))
				.pipe(livereload());
});

// Images
gulp.task('images', function () {

  return gulp.src(paths.images.src + '/**/*.{png,jpeg,jpg,svg,gif}')
  .pipe(plumber(function (err) {
    console.log('Images Task Error');
    console.log(err);
    this.emit('end');
  }))
  .pipe(imagemin(
    [
      imagemin.gifsicle(),
      imagemin.jpegtran(),
      imagemin.optipng(),
      imagemin.svgo(),
      imageminPngquant(),
      imageminJpegcompress()
    ]
  ))
  .pipe(gulp.dest(paths.images.dest))
	.pipe(livereload());
});


/*
 SVG - Sprite and Minify
 */
gulp.task('svg', function() {
    return gulp.src(paths.svgs.src + '/**/*.svg')
        .pipe(svgmin(function (file) {
            return {
                plugins: [{
                    cleanupIDs: {
                        minify: true
                    }
                }]
            }
        }))
        .pipe(svgstore())
        .pipe(gulp.dest(paths.svgs.dest))
				.pipe(livereload());
});


gulp.task("default", ['createFileIndex', 'compile', 'images', 'styles', 'typescript', 'hint', 'scripts', 'svg'], function() {
	console.log('starting watch task');
	require('./server.js');
	livereload.listen();
	gulp.watch('filelist.json',{cwd:'./'},['compile']);
	gulp.watch(paths.templates.src + '/*.handlebars',{cwd:'./'}, ['createFileIndex']);
	gulp.watch(paths.templates.src + '/**/*.handlebars',{cwd:'./'}, ['compile']);
	gulp.watch(paths.css.src + '/**/*.scss', ['styles']);
	gulp.watch(paths.ts.src + '/**/*.ts', ['typescript']);
	gulp.watch(paths.js.src + '/**/*.js', ['hint']);
	gulp.watch(paths.js.src + '/**/*.js', ['scripts']);
	gulp.watch(paths.svgs.src + '/**/*.svg', ['svg']);
	gulp.watch(paths.images.src + '/**/*.{png,jpeg,jpg,svg,gif}', ['images']);
});
