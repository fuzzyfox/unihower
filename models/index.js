/*
  require packages
 */
var fs = require( 'fs' );
var path = require( 'path' );
var lodash = require( 'lodash' );
var Sequelize = require( 'sequelize' );
var debug = require( 'debug' )( 'sequelize' );

module.exports = function( env ) {
  // create an object to return w/ the ORM
  var db = {};

  // get an instance of Sequelize
  var sequelize = new Sequelize( env.get( 'db_connection_uri' ), {
    logging: env.get( 'debug' ).match( /sequelize/i ) ? debug : false
  } );

  // load all model definitions
  fs.readdirSync( __dirname ).filter( function( file ) {
    // filter file matches to remove dotfiles and this file
    return ( ( file.indexOf( '.' ) !== 0 ) && ( file !== 'index.js' ) );
  }).forEach( function( file ) {
    // add model to the ORM
    var model = sequelize.import( path.join( __dirname, file ) );
    db[ model.name ] = model;
  });

  // associate models with each other
  Object.keys( db ).forEach( function( modelName ) {
    if( 'associate' in db[ modelName ] ) {
      db[ modelName ].associate( db );
    }
  });

  // return a usable ORM w/ instance and library
  return lodash.extend( {
    sequelize: sequelize,
    Sequelize: Sequelize
  }, db );
};
