/**
 * @file Provides handlers for all the publicly accessible routes for
 * the website/application (not including the API).
 * @module routes/public
 *
 * @license https://www.mozilla.org/MPL/2.0/ MPL-2.0
 */

/**
 * Public route for help pages.
 *
 * @param  {Habitat} env An instance of a habitat environment manipulator.
 * @return {Object}      An object containing all public route handlers.
 */
module.exports = function( env ) {
  return {
    /**
     * Website homepage.
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse}  res
     */
    topics: function( req, res ) {
      res.render( 'help/topics.html' );
    },
    tasks: function( req, res ) {
      res.render( 'help/tasks.html' );
    },
    account: function( req, res ) {
      res.render( 'help/account.html' );
    },
  };
};
