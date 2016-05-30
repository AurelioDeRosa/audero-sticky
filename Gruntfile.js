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

      clean: {
         dist: [
            '<%= config.dist %>/**'
         ]
      },

      browserify: {
         options: {
            banner: '/*! <%= pkg.name %>.js <%= pkg.version %> | Aurelio De Rosa (@AurelioDeRosa) | MIT/GPL-3.0 Licensed */',
            browserifyOptions: {
               debug: true,
               standalone: 'Sticky'
            },
            plugin: [
               ['minifyify', {
                  map: '<%= pkg.name %>.min.js.map',
                  output: '<%= config.dist %>/<%= pkg.name %>.min.js.map'
               }]
            ],
            transform: [
               ['babelify', {
                  plugins: [
                     'add-module-exports',
                     'transform-object-assign'
                  ]
               }]
            ]
         },
         dist: {
            files: {
               '<%= config.dist %>/<%= pkg.name %>.min.js': '<%= config.src %>/<%= pkg.name %>.js'
            }
         }
      },

      jscs: {
         options: {
            config: '.jscsrc',
            fix: true
         },
         src: [
            '<%= config.src %>/**/*.js'
         ]
      },

      jshint: {
         options: {
            jshintrc: '.jshintrc',
            reporter: require('jshint-stylish')
         },
         src: [
            '<%= config.src %>/**/*.js'
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
         files: ['<%= config.dist %>/*.js']
      }
   });

   grunt.registerTask('lint', [
      'jshint',
      'jscs'
   ]);

   grunt.registerTask('build', [
      'browserify',
      'compare_size'
   ]);

   grunt.registerTask('default', [
      'clean',
      'lint',
      'build'
   ]);
};