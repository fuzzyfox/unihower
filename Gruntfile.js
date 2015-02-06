module.exports = function( grunt ) {
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
        'test/**/*.js'
      ]
    },

    // less precompilation
    less: {
      // configure for development environment
      dev: {
        files: {
          'public/assets/css/eisenhower.css': 'public/assets/less/eisenhower.less'
        }
      },
      // configure for production environment
      prod: {
        options: {
          cleancss: true,
          sourceMap: true
        },
        files: {
          'public/assets/css/eisenhower.css': 'public/assets/less/eisenhower.less'
        }
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
        src: [ 'test/**/*.js' ]
      }
    },

    // run tasks on file changes
    watch: {
      express: {
        files: [
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
        tasks: [ 'less:dev' ]
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

  grunt.loadNpmTasks( 'grunt-contrib-jshint' );
  grunt.loadNpmTasks( 'grunt-contrib-less' );
  grunt.loadNpmTasks( 'grunt-express-server' );
  grunt.loadNpmTasks( 'grunt-contrib-watch' );
  grunt.loadNpmTasks( 'grunt-mocha-test' );
  grunt.loadNpmTasks('grunt-bump');

  grunt.registerTask( 'default', [ 'jshint', 'less:dev', 'express:dev', 'watch' ] );
  grunt.registerTask( 'test', [ 'jshint', 'mochaTest:test' ] );
  grunt.registerTask( 'build', [ 'less:prod' ] );
};
