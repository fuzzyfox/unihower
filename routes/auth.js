/**
 * @file Contains authentication handlers beyond Persona's user verification.
 * @module routes/auth
 *
 * @license https://www.mozilla.org/MPL/2.0/ MPL-2.0
 *
 * @requires models
 * @requires route/errors
 */

var jwt = require( 'jwt-simple' );

/**
 * Authentication exports
 *
 * @param  {Habitat} env An instance of a habitat environment manipulator.
 * @return {Object}      An object containing all the authentication middleware for routes.
 */
module.exports = function( env ) {
  var db = require( '../models' )( env );
  var errorResponse = require( './errors' )( env );
  var debug = require( 'debug' )( 'routes:auth' );

  return {
    /**
     * Middleware that updates client sessions when routes are called
     *
     * This is useful for maintiaing sessions of guest users and not just
     * standard users on restricted URIs, but all URIs.
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse} res
     * @param  {Function} next Callback for the next route handler
     */
    updateSession: function( req, res, next ) {
      /*
        check if valid jwt
       */
      // get jwt
      var token = req.body.access_token || req.query.access_token || req.headers[ 'x-access-token' ]; // jshint ignore:line
      if( token ) {
        // attempt to decode it
        try {
          token = jwt.decode( token, env.get( 'jwt_secret', env.get( 'session_secret' ) ) );
          // check the token is still valid
          if( token.exp >= Date.now() ) {
            // attach token issuer to session email
            req.session.email = token.iss;
          }
        }
        // if its invalid catch and debug, but utlimately move on
        catch( err ) {
          debug( err );
        }
      }

      /*
        check if verified using jwt or persona
       */
      if( !req.session.email ) {
        req.session.user = {};
        return next();
      }

      // if verified try to find the correct user details.
      db.User.find({
        where: {
          email: req.session.email.toLowerCase()
        }
      }).done( function( err, user ) {
        // if error from db http 500
        if( err ) {
          return errorResponse.internal( req, res, err );
        }

        // if no user returned just continue on, with empty user data in session
        if( !user ) {
          req.session.user = {};
          return next();
        }

        // found a user
        // update last login
        user.lastLogin = ( new Date() ).toISOString();

        // save last login and continue on
        return user.save().done( function( err ) {
          // if error saving http 500
          if( err ) {
            return errorResponse.internal( req, res, err );
          }

          // continue on if valid user
          req.session.user = user.dataValues;
          next();
        });
      });
    },
    /**
     * A middleware route to ensure a user is verified
     *
     * A users email must exist in the database, to proced to the
     * next handler. If the user does exist then their `lastLogin`
     * time is updated and `req.session.user` is set to the most
     * recent data on the user stored in the database.
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse} res
     * @param  {Function} next Callback for the next route handler
     */
    enforce: function( req, res, next ) {
      /*
        check verified user
       */
      if( !req.session.email ) {
        return errorResponse.unauthorized( req, res );
      }

      /*
        check valid user
       */
      db.User.find({
        where: {
          email: req.session.email.toLowerCase()
        }
      }).done( function( err, user ) {
        // if error from db http 500
        if( err ) {
          return errorResponse.internal( req, res, err );
        }

        // if no user returned from search then do not auth
        if( !user ) {
          return errorResponse.unauthorized( req, res );
        }

        // continue on if valid user
        req.session.user = user.dataValues;
        next();
      });
    },
    /**
     * A middleware route to ensure a user is an administrator
     *
     * Relies on `enforce` having been run to ensure user is verified. The
     * `req.session.user.isAdmin` flag is then simply checked before handoff.
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse} res
     * @param  {Function} next Callback for the next route handler
     */
    enforceAdmin: function( req, res, next ) {
      // if user is not admin http 403
      if( !req.session.user.isAdmin ) {
        return errorResponse.forbidden( req, res );
      }

      // continue on if admin
      next();
    },
    whoami: function( req, res ) {
      res.json( req.session.user );
    }
  };
};
