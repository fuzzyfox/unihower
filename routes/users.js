/**
 * @file Provides logic for loading User http routes.
 * @module routes/users
 *
 * @license https://www.mozilla.org/MPL/2.0/ MPL-2.0
 */

/**
 * Users route handlers.
 *
 * @example
 *
 *  // assuming you've loaded an environment into `env`
 *  var userRoutes = require( './routes/users' )( env );
 *
 *  app.get( '/users/create', userRoutes.create );
 *  app.get( '/users/:id', userRoutes.user );
 *
 * @param  {Habitat} env An instance of a habitat environment manipulator.
 * @return {Object}      An object contaning all the HTTP route handlers for users.
 */
module.exports = function( env ) {
  var db = require( '../models' )( env );
  var errorResponse = require( './errors' )( env );
  var debug = require( 'debug' )( 'routes:users' );

  return {
    /**
     * Handle requests for a listing of ALL users.
     *
     * **Note:** Will only load listing administrators.
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse}  res
     */
    users: function( req, res ) {
      debug( 'Getting ALL users.' );

      if( req.session.user.isAdmin ) {
        return db.User.findAll().done( function( err, users ) {
          if( err ) {
            debug( 'ERROR: Failed to get users. (err)' );
            debug( err );

            return errorResponse.internal( req, res, err );
          }

          res.render( 'users/users.html', { users: users } );
        });
      }

      return errorResponse.forbidden( req, res );
    },
    /**
     * Handle requests for a specific user.
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse}  res
     */
    user: function( req, res ) {
      debug( 'Get user: %d', req.params.id );

      if( ( req.session.user.id === parseInt( req.params.id, 10 ) ) || ( req.session.user.isAdmin ) ) {
        if(req.session.user.isAdmin) {
          debug( '↳ Getting user as Admin' );
        }

        return db.User.find( req.params.id ).done( function( err, user ) {
          if( err ) {
            debug( 'ERROR: Failed to get user. (err, userId)' );
            debug( err, req.params.id );

            return errorResponse.internal( req, res, err );
          }

          if( !user ) {
            return errorResponse.notFound( req, res );
          }

          res.render( 'users/user.html', JSON.parse( JSON.stringify( user ) ) );
        });
      }

      return errorResponse.forbidden( req, res );
    },
    /**
     * Handle requests for user creation form.
     *
     * **Note:** Will only load for new users, and administrators. Else will
     * redirect to the current users own details page.
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse}  res
     */
    create: function( req, res ) {
      debug( 'Get user creation form.' );

      if( !req.session.email ) {
        return errorResponse.unauthorized( req, res, 'Please login with persona before finishing account creation.' );
      }

      if( req.session.user.id && !req.session.user.isAdmin ) {
        debug( '↳ User session exists and non-admin, redirect to user details.' );

        res.redirect( '/topics' );
      }

      res.render( 'users/create.html' );
    },
    /**
     * Handle requests for user update form.
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse}  res
     */
    update: function( req, res ) {
      debug( 'Update user form.' );

      if( ( req.session.user.id !== parseInt( req.params.id, 10 ) ) && ( !req.session.user.isAdmin ) ) {
        return errorResponse.forbidden( req, res );
      }

      return db.User.find( req.params.id ).done( function( err, user ) {
        if( err ) {
          debug( 'ERROR: Failed to get user. (err, userId)' );
          debug( err, req.params.id );

          return errorResponse.internal( req, res, err );
        }

        if( !user ){
          return errorResponse.notFound( req, res );
        }

        res.render( 'users/update.html', JSON.parse( JSON.stringify( user ) ) );
      });
    }
  };
};
