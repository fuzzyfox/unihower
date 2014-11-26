/**
 * @file Provides a set of standard error handlers for use with http requests.
 * @module routes/errors
 *
 * @license https://www.mozilla.org/MPL/2.0/ MPL-2.0
 */

/**
 * HTTP error handlers.
 *
 * @example
 *
 *  // assuming the client has authenticated as a standard user
 *  // and that you've loaded an environment into `env`
 *  var errorResponse = require( './routes/errors' )( env );
 *
 *  app.get( '/some/admin/route', function( req, res ) {
 *    if( req.session.user.isAdmin ) {
 *      // user is not an admin, send HTTP 403 Forbidden response
 *      return errorResponse.forbidden( req, res );
 *    }
 *
 *    // user is admin do admin type stuff
 *    ...
 *  });
 *
 * @param  {Habitat} env An instance of a habitat environment manipulator .
 * @return {Object}      An object containing all the HTTP error handlers.
 */
module.exports = function( env ) {
  return {
    /**
     * HTTP 400 Bad Request
     *
     * This should be used when there was an error while processing
     * the request payload (malformed JSON, for instance).
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse}  res
     * @param  {String}               [msg] A custom error message to return. Defaults to "Failed to parse requested payload.".
     */
    badRequest: function( req, res, msg ) {
      res.format({
        html: function() {
          res.status( 400 ).send( msg || 'Bad Request' );
        },
        json: function() {
          res.status( 400 ).json({
            status: 'Bad Request',
            message: msg || 'Failed to parse requested payload.'
          });
        },
        default: function() {
          res.status( 406 ).send( 'Not Acceptable' );
        }
      });
    },
    /**
     * HTTP 401 Unauthorized
     *
     * This should be used when a request is not authenticiated.
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse}  res
     * @param  {String}               [msg] A custom error message to return. Defaults to "You must be logged in to use this resource.".
     */
    unauthorized: function( req, res, msg ) {
      res.format({
        html: function() {
          res.status( 401 ).send( msg || 'Unauthorized' );
        },
        json: function() {
          res.status( 401 ).json({
            status: 'Unauthorized',
            message: msg || 'You must be logged in to use this resource.'
          });
        },
        default: function() {
          res.status( 406 ).send( 'Not Acceptable' );
        }
      });
    },
    /**
     * HTTP 403 Bad Request
     *
     * This should be used when the request is successfully authenticiated (see 401), but the
     * action was forbidden.
     *
     * @see {@link unauthorized}
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse}  res
     * @param  {String}               [msg] A custom error message to return. Defaults to "You are not permitted to use this resource.".
     */
    forbidden: function( req, res, msg ) {
      res.format({
        html: function() {
          res.status( 403 ).send( msg || 'Forbidden' );
        },
        json: function() {
          res.status( 403 ).json({
            status: 'Forbidden',
            message: msg || 'You are not permitted to use this resource.'
          });
        },
        default: function() {
          res.status( 406 ).send( 'Not Acceptable' );
        }
      });
    },
    /**
     * HTTP 404 Not Found
     *
     * This should be used when the requested resource cannot be found.
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse}  res
     * @param  {String}               [msg] A custom error message to return. Defaults to "Not Found".
     */
    notFound: function( req, res, msg ) {
      res.format({
        html: function() {
          res.status( 404 ).send( msg || ( req.originalUrl + ' Not Found' ) );
        },
        json: function() {
          res.status( 404 ).json({
            status: 'Not Found',
            message: msg || ( req.originalUrl + ' Not Found' )
          });
        },
        default: function() {
          res.status( 406 ).send( 'Not Acceptable' );
        }
      });
    },
    /**
     * HTTP 409 Conflict
     *
     * This should be used when request could not be processed because of conflict in the request,
     * such as an edit conflict, or duplicate entry.
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse}  res
     * @param  {String}               [msg] A custom error message to return. Defaults to "Unable to process request due to a confilct.".
     */
    confilct: function( req, res, msg ) {
      res.format({
        html: function() {
          res.status( 409 ).send( msg || 'Confilct' );
        },
        json: function() {
          res.status( 409 ).json({
            status: 'Confilct',
            message: msg || 'Unable to process request due to a confilct.'
          });
        },
        default: function() {
          res.status( 406 ).send( 'Not Acceptable' );
        }
      });
    },
    /**
     * HTTP 410 Gone
     *
     * This should be returned when the requested resource is permenantely deleted and will
     * never be available again.
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse}  res
     * @param  {String}               [msg] A custom error message to return. Defaults to "This resource is no longer available.".
     */
    gone: function( req, res, msg ) {
      res.format({
        html: function() {
          res.status( 410 ).send( msg || 'Gone' );
        },
        json: function() {
          res.status( 410 ).json({
            status: 'Gone',
            message: msg || 'This resource is no longer available.'
          });
        },
        default: function() {
          res.status( 406 ).send( 'Not Acceptable' );
        }
      });
    },
    /**
     * HTTP 418 I'm a Teapot
     *
     * This should be used when the request is to be sent over HTCPCP.
     *
     * @see {@link https://tools.ietf.org/html/rfc2324}
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse}  res
     * @param  {String}               [msg] A custom error message to return. Defaults to "The resulting entity may be short and stout.".
     */
    teapot: function( req, res, msg ) {
      res.format({
        html: function() {
          res.status( 418 ).send( msg || 'I\'m a Teapot' );
        },
        json: function() {
          res.status( 418 ).json({
            status: 'I\'m a Teapot',
            message: msg || 'The resulting entity may be short and stout.'
          });
        },
        default: function() {
          res.status( 406 ).send( 'Not Acceptable' );
        }
      });
    },
    /**
     * HTTP 500 Internal Server Error
     *
     * This should be used when the server encounters an expected issue that will prevent it
     * from fulfilling the request.
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse}  res
     * @param  {String}               [msg] A custom error message to return. Defaults to "An unexpected error has occured. Try again later.".
     */
    internal: function( req, res, msg ) {
      res.format({
        html: function() {
          res.status( 500 ).send( msg || 'Internal Server Error' );
        },
        json: function() {
          res.status( 500 ).json({
            status: 'Internal Server Error',
            message: msg || 'An unexpected error has occured. Try again later.'
          });
        },
        default: function() {
          res.status( 406 ).send( 'Not Acceptable' );
        }
      });
    },
  };
};
