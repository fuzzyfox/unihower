/**
 * @file Exposes basic data about the server thats useful for checking health/status.
 * @module routes/healthcheck
 *
 * @license https://www.mozilla.org/MPL/2.0/ MPL-2.0
 */

/**
 * Healthcheck export
 * @param  {Habitat} env An instance of a habitat environment manipulator.
 * @return {Function}    Handler for an expressjs request (typically GET).
 */
module.exports = function( env ) {
  return function( req, res ) {
    res.jsonp({
      version: env.get( 'pkg' ).version,
      http: 'okay'
    });
  };
};
