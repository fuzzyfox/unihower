/**
 * @file Contains route handlers for all the administrator specific routes.
 * @module routes/admin
 *
 * @license https://www.mozilla.org/MPL/2.0/ MPL-2.0
 *
 * @requires models
 * @requires route/errors
 */

/**
 * Administraion route exports
 *
 * @param  {Habitat} env An instance of a habitat environment manipulator.
 * @return {Object}      An object containing all the authentication middleware for routes.
 */
module.exports = function( env ) {
  var db = require( '../models' )( env );
  var email = require( '../libs/email' )( env );
  var errorResponse = require( './errors' )( env );
  var debug = require( 'debug' )( 'routes:admin' );

  return {
    /**
     * User management.
     *
     * Route exists for consistency, and simply redirects to "/users"
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse}  res
     */
    users: function( req, res ) {
      return res.redirect( '/users' );
    },
    /**
     * Email management handlers.
     * @type {Object}
     */
    email: {
      /**
       * Email creation form.
       *
       * @param  {http.IncomingMessage} req
       * @param  {http.ServerResponse}  res
       */
      get: function( req, res ) {
        res.render( 'admin/email.html', {
          from: env.get( 'email_from' )
        } );
      },
      /**
       * Email submission processing.
       *
       * @param  {http.IncomingMessage} req
       * @param  {http.ServerResponse}  res
       */
      post: function( req, res ) {
        db.User.findAll({
          where: {
            sendNotifications: true
          },
          attributes: [ 'id' ]
        }, { raw: true }).done( function( err, users ) {
          // database error
          if( err ) {
            debug( 'ERROR: Failed to get users from database. (err)' );
            debug( err );
            return errorResponse.internal( req, res, err );
          }

          var userIds = [];
          users.forEach( function( user ) {
            userIds.push( user.id );
          });

          email.sendBulkRaw( userIds, { subject: req.body.subject }, req.body.message, function( errs, info ) {
            // error sending email
            if( errs.length ) {
              errs.forEach( function( err ) {
                debug( 'ERROR: ' + err.message + ' (err)' );
                debug( err );
              });

              return errorResponse.internal( req, res, errs );
            }

            res.status( 200 ).json( info );
          });
        });
      }
    }
  };
};
