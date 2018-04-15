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
		fs = require('fs');

		basepaths = {
		        src: 'source',
		        dest: ''
		    },

		    paths = {
		        js: {
		            src: basepaths.src + '/js',
		            dest: basepaths.dest + 'js',
		            node: 'node_modules'
		            // bower: 'bower_components'
		        },
		        css: {
		            src: basepaths.src + '/sass',
		            dest: ''
		        },
		        templates: {
		          src: basepaths.src + '/templates',
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
		gulp.src(['./src/*.*'])
      .pipe(filelist('filelist.json', { flatten: true, removeExtensions: true }))
      .pipe(gulp.dest("./"));
});

gulp.task('compile', function () {
	var templateList = JSON.parse(fs.readFileSync("./filelist.json", "utf8"));
	var templateData = {
		firstName: 'Bren',
		templates: templateList
	},
	options = {
		ignorePartials: true, //ignores the unknown footer2 partial in the handlebars template, defaults to false
		batch : ['./src/partials'],
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
		return gulp.src('src/' + templateName + '.handlebars')
			.pipe(handlebars(templateData, options))
			.pipe(rename(templateName + '.html'))
			.pipe(gulp.dest('dist'));
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
        .pipe(gulp.dest(paths.css.dest));
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
 Scripts - Concat and Uglify
 */
gulp.task('scripts',['hint','vendor'],  function() {
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
        .pipe(concat('./all.min.js'))
        .pipe(sourcemaps.init())
        .pipe(uglify())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(paths.js.dest));
});

gulp.task('clean-styles', function () {
    return gulp.src('style.css', {read: false})
        .pipe(clean());
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
        .pipe(gulp.dest(paths.svgs.dest));
});


gulp.task("default", ['createFileIndex', 'compile', 'templates', 'styles', 'hint', 'scripts', 'svg'], function() {
	gulp.watch('src/*.handlebars',{cwd:'./'}, ['createFileIndex'])
	gulp.watch('src/**/*.handlebars',{cwd:'./'}, ['compile'])
	gulp.watch('filelist.json',{cwd:'./'},['compile']);
	gulp.watch(paths.templates.src + '/**/*.scss', ['templates']);
	gulp.watch(paths.css.src + '/**/*.scss', ['styles']);
	gulp.watch(paths.js.src + '/**/*.js', ['hint']);
	gulp.watch(paths.js.src + '/**/*.js', ['scripts']);
	gulp.watch(paths.svgs.src + '/**/*.svg', ['svg']);
});
