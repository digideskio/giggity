var gulp   			= require('gulp');
var concat 			= require('gulp-concat');
var filter 			= require('gulp-filter');
var bower  			= require('bower-files')();
var inject		 	= require("gulp-inject");
var series 			= require('stream-series');
var uglify 			= require('gulp-uglify');
var minifyCSS 	= require('gulp-minify-css');
var rev 				= require('gulp-rev');
var del 				= require('del');
var ngAnnotate 	= require('gulp-ng-annotate');
var templates 	= require('gulp-angular-templates');
var gulpMerge 	= require('gulp-merge');
var git 				= require('gulp-git');

gulp.task('clean', function(cb){
	del.sync(['lib/*', 'fonts/*']);
	cb();
});

gulp.task('bower', ['clean'], function(cb){
  var libjs = gulp.src(bower.ext('js').files)
    .pipe(concat('third-party.js'))
    .pipe(uglify())
		.pipe(rev())
    .pipe(gulp.dest('./lib'))

  var libcss = gulp.src(bower.ext('css').files)
    .pipe(concat('third-party.css'))
    .pipe(minifyCSS())
		.pipe(rev())
    .pipe(gulp.dest('./lib'))

  var fonts = gulp.src(bower.ext(['eot', 'woff', 'woff2', 'ttf', 'svg']).files)
    .pipe(gulp.dest('./fonts'))

	// console.log(bower.files);
	var partials = gulp.src('partials/*.html')
		.pipe(templates({module:'Giggity', basePath: 'partials/'}))

	var appjs = gulpMerge(
			gulp.src(['./js/*.js']),
			partials
		)
		.pipe(concat('app.js'))
		.pipe(ngAnnotate())
		.pipe(uglify())
		.pipe(rev())
		.pipe(gulp.dest('./lib'))

	var appcss = gulp.src(['./css/*.css'])
		.pipe(concat('app.css'))
		.pipe(minifyCSS())
		.pipe(rev())
		.pipe(gulp.dest('./lib'))

	return series(libjs, libcss, fonts, appjs, appcss);

});

gulp.task('index', ['bower'], function (cb) {
  var target = gulp.src('index.html');
  // It's not necessary to read the files (will speed up things), we're only after their paths:
	var libSources = gulp.src(['./lib/third-party*'], {read: false});
  var sources = gulp.src(['./lib/app*'], {read: false});
  return target.pipe(inject(series(libSources, sources), {relative: true}))
    .pipe(gulp.dest(''));
});

gulp.task('dev', function() {
	var target = gulp.src('index.html');
	var libSources = gulp.src(['./lib/third-party*'], {read: false});
	var sources = gulp.src(['./js/*', './css/*'], {read: false});
	return target.pipe(inject(series(libSources, sources), {relative: true}))
		.pipe(gulp.dest(''));
});

gulp.task('default', ['index'], function() {
	return gulp.src('./lib/')
		.pipe(git.add());
});
