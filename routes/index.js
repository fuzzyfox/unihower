/*
  require packages
 */
var fs = require( 'fs' );
var debug = require( 'debug' )( 'route-loader' );


module.exports = function( env ) {

  /**
   * Recursively searches for, and loads route definitions.
   *
   * Returns routes as an object in the form
   *
   * @example
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
    debug( 'Searching %s', dir );

    // find all files + dirs in current dir
    fs.readdirSync( dir ).filter( function( file ) {
      // return true if not a dotfile and not this file
      return ( ( file.indexOf( '.' ) !== 0 ) && ( file !== 'index.js' ) );
    }).forEach( function( file ) {
      // check if dir + recurse if so
      if( fs.statSync( dir + '/' + file ).isDirectory() ) {
        debug( 'Sub-directory found, recursing' );

        // before recursion create new object
        routes[ file ] = {};
        return findRoutes( dir + '/' + file, routes[ file ] );
      }

      debug( 'Requiring file %s/%s', dir, file );
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
