/**
 * @file defines Grunt tasks used for the development, testing, and building
 * of the project.
 */

module.exports = function( grunt ) {
  /*
    Initialise grunt configuration
   */
  grunt.initConfig({
    // package information
    pkg: grunt.file.readJSON( 'package.json' ),

    // config for jshint task
    jshint: {
      options: {
        jshintrc: true
      },
      files: [
        'Gruntfile.js',
        '*.js',
        'models/**/*.js',
        'routes/**/*.js',
        'libs/**/*.js',
        'test/**/*.js',
        'emailTemplates/**/*.js'
      ]
    },

    // minify css files
    cssmin: {
      target: {
        files: [{
          expand: true,
          src: 'public/assets/css/**/*.css'
        }]
      }
    },

    // run the server in development environment
    express: {
      dev: {
        options: {
          script: './server.js',
          node_env: 'development', // jshint ignore:line
          port: 4321
        }
      }
    },

    // run mocha tests
    mochaTest: {
      test: {
        options: {
          reporter: 'spec'
        },
        src: [
          'test/**/*.js',
          '!test/email/**/*.js',
          '!test/**/_*.js'
        ]
      },
      testEmail: {
        options: {
          reporter: 'spec'
        },
        src: [
          'test/email/**/*.js',
          '!test/**/_*.js'
        ]
      }
    },

    // run tasks on file changes
    watch: {
      express: {
        files: [
          '.env',
          '*.js',
          'models/**/*.js',
          'routes/**/*.js',
          'libs/**/*.js'
        ],
        tasks: [ 'jshint', 'express:dev' ],
        options: {
          spawn: false
        }
      },
      styles: {
        files: [ 'public/assets/less/**/*.less' ],
        tasks: [ 'less' ]
      }
    },

    // bump version number
    bump: {
      options: {
        files: [ 'package.json', 'bower.json' ],
        commit: true,
        commitMessage: 'Version changed to v%VERSION%',
        commitFiles: [ 'package.json', 'bower.json' ],
        createTag: true,
        tagName: 'v%VERSION%',
        push: false
      }
    }
  });

  /*
    Custom task to compile less w/ all possible bootswatch themes
   */
  (function(){
    var tasks = {};

    // get all theme names
    var themeBaseDir = 'public/vendor/bootswatch/';
    var themes = grunt.file.expand( [ themeBaseDir + '*/', '!' + themeBaseDir + 'fonts/' ] );
    var themeNames = [];
    themes.forEach( function( theme ) {
      themeNames.push( theme.replace( themeBaseDir, '' ).replace( '/', '' ) );
    });

    themeNames.forEach( function( theme ) {
      tasks[ theme ] = {
        options: {
          modifyVars: {
            'bootswatch-theme': theme
          },
        },
        dest: 'public/assets/css/eisenhower-' + theme + '.css',
        src: 'public/assets/less/eisenhower.less'
      };
    });

    grunt.config( 'less', tasks );
  })();

  /*
    Load task via npm
   */
  grunt.loadNpmTasks( 'grunt-contrib-jshint' );
  grunt.loadNpmTasks( 'grunt-contrib-less' );
  grunt.loadNpmTasks( 'grunt-contrib-cssmin' );
  grunt.loadNpmTasks( 'grunt-express-server' );
  grunt.loadNpmTasks( 'grunt-contrib-watch' );
  grunt.loadNpmTasks( 'grunt-mocha-test' );
  grunt.loadNpmTasks( 'grunt-bump' );

  /*
    Register specific tasks
   */
  grunt.registerTask( 'default', [ 'jshint', 'less', 'express:dev', 'watch' ] );
  grunt.registerTask( 'test', [ 'jshint', 'mochaTest:test' ] );
  grunt.registerTask( 'test-email', [ 'jshint', 'mochaTest:testEmail' ] );
  grunt.registerTask( 'build', [ 'less', 'cssmin' ] );
};
