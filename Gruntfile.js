module.exports = function (grunt) {
   'use strict';

   require('time-grunt')(grunt);
   require('jit-grunt')(grunt);

   var config = {
      src: 'src',
      dist: 'dist'
   };

   grunt.initConfig({
      pkg: grunt.file.readJSON('package.json'),
      config: config,

      uglify: {
         options: {
            banner: '/*! audero-sticky.js <%= pkg.version %> | Aurelio De Rosa (@AurelioDeRosa) | MIT/GPL-3.0 Licensed */',
            sourceMap: true,
            screwIE8: true
         },
         dist: {
            files: {
               '<%= config.dist %>/audero-sticky.min.js': ['<%= config.src %>/audero-sticky.js']
            }
         }
      },
      jscs: {
         options: {
            config: '.jscsrc',
            fix: true
         },
         dist: '<%= jshint.src %>'
      },

      jshint: {
         options: {
            jshintrc: '.jshintrc',
            reporter: require('jshint-stylish'),
            // force property set to true to workaround jshint issue #1368:
            // https://github.com/jshint/jshint/issues/1368
            force: true
         },
         src: [
            'src/*.js'
         ]
      },

      compare_size: {
         options: {
            cache: '.sizecache.json',
            compress: {
               gz: function(fileContents) {
                  return require('gzip-js').zip(fileContents, {}).length;
               }
            }
         },
         files: ['dist/*.js']
      }
   });

   grunt.registerTask('lint', [
      'jshint',
      'jscs'
   ]);

   grunt.registerTask('build', [
      'uglify',
      'compare_size'
   ]);

   grunt.registerTask('default', [
      'lint',
      'build'
   ]);
};