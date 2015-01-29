/**
 * @file Loads all routes into a single object.
 * @module routes/index
 *
 * @license https://www.mozilla.org/MPL/2.0/ MPL-2.0
 */

/*
  require packages
 */
var fs = require( 'fs' );
var debug = require( 'debug' )( 'routes' );

/**
 * Route module exports.
 *
 * @example
 *
 *  // assuming you've loaded an environment into `env`
 *  var routes = require( './routes' )( env );
 *
 *  // uses the `list` method found in `./routes/api/users.js`
 *  // to handle the request
 *  app.get( '/api/users', routes.api.users.list );
 *
 * @param  {Habitat} env An instance of a habitat environment manipulator. This will
 *                       be passed automatically to any handlers found by this module.
 * @return {Object}      An object containing all route handlers found.
 */
module.exports = function( env ) {

  /**
   * Recursively searches for, and loads route definitions.
   *
   * @example
   * var routes = findRoutes( __dirname );
   *
   * // Returns routes as an object in the form:
   * {
   *   root_dir: {
   *     sub_dir: {
   *       filename: routeObj
   *     }
   *   }
   * }
   *
   * @param  {String} dir    Path for the directory to search.
   * @param  {Object} routes Something assign routes to.
   * @return {Object}        All the loaded routes in the format above.
   */
  var findRoutes = function( dir, routes ) {
    debug( 'Loading routes from %s', dir );

    // find all files + dirs in current dir
    fs.readdirSync( dir ).filter( function( file ) {
      // return true if not a dotfile and not this file
      return ( ( file.indexOf( '.' ) !== 0 ) && ( file !== 'index.js' ) );
    }).forEach( function( file ) {
      // check if dir + recurse if so
      if( fs.statSync( dir + '/' + file ).isDirectory() ) {
        // before recursion create new object
        routes[ file ] = {};
        return findRoutes( dir + '/' + file, routes[ file ] );
      }

      // for a file remove the extension and require it into
      // routes obj
      file = file.split( '.' )[ 0 ];
      routes[ file ] = require( dir + '/' + file )( env );
    });

    // return final results
    return routes;
  };

  // start searching from current dir for routes.
  return findRoutes( __dirname, {} );
};
