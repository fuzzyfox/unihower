/**
 * @file Provides handlers for all the publicly accessible routes for
 * the website/application (not including the API).
 * @module routes/public
 *
 * @license https://www.mozilla.org/MPL/2.0/ MPL-2.0
 */

/**
 * Public route exports.
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
    index: function( req, res ) {
      if( req.session.user.id ) {
        return res.redirect( '/topics' );
      }

      res.render( 'index.html' );
    },
    /**
     * Information about the app and how the system works.
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse}  res
     */
    about: function( req, res ) {
      res.render( 'about.html' );
    },
    /**
     * Legal information page.
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse}  res
     */
    legal: function( req, res ) {
      res.render( 'legal.html' );
    }
  };
};
