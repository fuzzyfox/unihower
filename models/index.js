/**
 * @file Loads models into a single usable ORM object.
 * @module models
 *
 * @license https://www.mozilla.org/MPL/2.0/ MPL-2.0
 */

/*
  require packages
 */
var fs = require( 'fs' );
var path = require( 'path' );
var lodash = require( 'lodash' );
var Sequelize = require( 'sequelize' );
var Umzug = require( 'umzug' ); // migrator framework
var debugLib = require( 'debug' );
var debug = debugLib( 'models' );

/**
 * Models/ORM Exports
 *
 * @example
 *
 *  // assuming you've loaded an environment into `env`
 *  var db = require( './models' )( env );
 *  db.SomeModel.find().done( function( err, result ) { ... } );
 *
 * @param  {Habitat} env An instance of a habitat environment manipulator.
 * @return {Function}    When provided with an environment this returned function returns a usable ORM.
 */
module.exports = function( env ) {
  // if an instance of the database already exists use that.
  if( env.dbInstance ) {
    return env.dbInstance;
  }

  /**
   * Ready flag to indicate when all setup tasks are complete
   * @type {Boolean}
   */
  var readyFlag = false;
  /**
   * Functions that need to be run once we're ready
   * @type {Array}
   */
  var readyFns = [];

  /**
   * Trigger functions that depend on the database being ready.
   */
  function readyTrigger() {
    if( readyFlag ) {
      return;
    }

    debug( 'Database ORM ready' );
    readyFlag = true;

    for( var i = 0, len = readyFns.length; i < len; i++ ) {
      readyFns[ i ].call();
    }
  }

  /**
   * Object to return the ORM in
   * @type {Object}
   */
  var db = {};

  /**
   * Configured Sequelize instance
   * @type {Sequelize}
   */
  var sequelize = new Sequelize( env.get( 'db_connection_uri' ), {
    logging: debugLib( 'sequelize' )
  });

  /*
    load all model definitions
   */
  fs.readdirSync( __dirname ).filter( function( file ) {
    // filter file matches to remove dotfiles and this file
    return ( ( file.indexOf( '.' ) !== 0 ) && ( file !== 'index.js' ) );
  }).forEach( function( file ) {
    debug( 'Loading model from %s', file );
    // add model to the ORM
    var model = sequelize.import( path.join( __dirname, file ) );
    db[ model.name ] = model;
  });

  /*
    associate models with each other
   */
  Object.keys( db ).forEach( function( modelName ) {
    if( 'associate' in db[ modelName ] ) {
      db[ modelName ].associate( db );
    }
  });

  /*
    run database synchronisation and migrations
   */
  // sync db
  sequelize.sync({
    force: env.get( 'db_force_sync' )
  }).complete( function( err ) {
    if( err ) {
      debug( 'ERROR: Failed to synchronise with database.' );
      debug( err );
      throw err;
    }

    // configure migrator instance
    var umzug = new Umzug({
      storage: 'sequelize',
      storageOptions: {
        sequelize: sequelize
      },
      migrations: {
        params: [
          sequelize.getQueryInterface(),
          sequelize.constructor
        ],
        path: process.cwd() + '/migrations'
      },
      logging: debugLib( 'umzug' )
    });

    umzug.up().then( function() {
      // all done, trigger waiting callbacks
      readyTrigger();
    });
  });

  // create a usable ORM w/ instance and library
  db = lodash.extend( {
    sequelize: sequelize,
    Sequelize: Sequelize,
    /**
     * DB ready function.
     *
     * Triggers given callback method ONCE the database ORM is ready for use.
     * @param  {Function} fn Callback Function
     */
    ready: function( fn ) {
      return ( readyFlag ) ? fn.call() : readyFns.push( fn );
    }
  }, db );

  // cache db on env
  env.dbInstance = db;

  // return db
  return db;
};
