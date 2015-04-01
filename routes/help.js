/**
 * @file Provides handlers for all the publicly accessible routes for
 * the website/application (not including the API).
 * @module routes/help
 *
 * @license https://www.mozilla.org/MPL/2.0/ MPL-2.0
 */

var debug = require( 'debug' )( 'routes:help' );

/**
 * Public route for help pages.
 *
 * @param  {Habitat} env An instance of a habitat environment manipulator.
 * @return {Object}      An object containing all public route handlers.
 */
module.exports = function( env ) {
  return function( req, res, next ) {
    if( ! req.params.page ) {
      return res.render( 'help.html' );
    }

    try {
      res.render( 'help/' + req.params.page + '.html' );
    }
    catch ( err ) {
      debug( err );
      next();
    }
  };
};
