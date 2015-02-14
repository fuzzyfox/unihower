/**
 * @file defines Grunt tasks used for the development, testing, and building
 * of the project.
 */

// load a few this needed to precompile ember templates
var fs = require( 'fs' );
var path = require( 'path' );
var templateCompiler = require( './public/vendor/ember/ember-template-compiler' );

// move onto defining the grunt tasks/config
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
        'test/**/*.js',
        'emailTemplates/**/*.js',
        'app/**/*.js'
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

    // uglify scripts
    uglify: {
      ember: {
        options: {
          mangle: false,
          beautify: true,
          sourceMap: true
        },
        files: {
          'public/ember/app.js': [
            'app/app.js',
            'app/session.js',
            'app/router.js',
            'app/store.js',
            'app/components/**/*.js',
            'app/controllers/**/*.js',
            'app/helpers/**/*.js',
            'app/models/**/*.js',
            'app/routes/**/*.js',
            'app/views/**/*.js',
          ]
        }
      }
    },

    // emberjs template precompilation
    compileHtmlBars: {
      build: {
        templateBasePath: 'app/templates/',
        files: {
          'public/ember/templates.js': 'app/templates/**/*.hbs'
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
        src: [
          'test/**/*.js',
          '!test/email/**/*.js'
        ]
      },
      testEmail: {
        options: {
          reporter: 'spec'
        },
        src: [
          'test/email/**/*.js'
        ]
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
        tasks: [ 'less:dev' ],
        options: {
          livereload: true
        }
      },
      compileHtmlBars: {
        files: [ 'app/templates/**/*.hbs' ],
        tasks: [ 'compileHtmlBars' ],
        options: {
          livereload: true
        }
      },
      emberApp: {
        files: [ 'app/**/*.js' ],
        tasks: [ 'jshint', 'uglify:ember' ],
        options: {
          livereload: true
        }
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

  // precomile task handling for ember templates
  grunt.registerMultiTask( 'compileHtmlBars', 'Pre-compile HTMLBars tempates', function() {

    var done = this.async();
    var self = this;

    this.files.forEach( function( file ) {

      var stream = fs.createWriteStream( path.join( __dirname, file.dest ), {
        encoding: 'utf8'
      });

      stream.once( 'open', function( fd ) {
        grunt.log.writeln( 'Pre-compiling ' + file.src.length + ' handlebars templates...' );

        // process each template
        file.src.forEach( function( f ) {
          // load the template
          var template = fs.readFileSync( path.join( process.cwd(), f ), {
            encoding: 'utf8'
          });
          var name = f.replace( new RegExp( '^' + self.data.templateBasePath ), '' ).replace( /\.hbs$/, '' );

          // compile the template
          stream.write( 'Ember.TEMPLATES["' + name + '"] = Ember.HTMLBars.template(' );
          stream.write( templateCompiler.precompile( template ) + ');\n\n' );
        });

        stream.end( done );
      });
    });
  });

  grunt.loadNpmTasks( 'grunt-contrib-jshint' );
  grunt.loadNpmTasks( 'grunt-contrib-less' );
  grunt.loadNpmTasks( 'grunt-express-server' );
  grunt.loadNpmTasks( 'grunt-contrib-watch' );
  grunt.loadNpmTasks( 'grunt-mocha-test' );
  grunt.loadNpmTasks( 'grunt-bump' );
  grunt.loadNpmTasks( 'grunt-contrib-uglify' );

  grunt.registerTask( 'default', [ 'jshint', 'less:dev', 'uglify:ember', 'compileHtmlBars', 'express:dev', 'watch' ] );
  grunt.registerTask( 'test', [ 'jshint', 'mochaTest:test' ] );
  grunt.registerTask( 'test-email', [ 'jshint', 'mochaTest:testEmail' ] );
  grunt.registerTask( 'build', [ 'less:prod', 'uglify:ember', 'compileHtmlBars' ] );
};
