/**
 * @file Provides handlers for user api routes.
 *
 * @example
 *   var userApiRoutes = require( './routes/api/users' )( env );
 *   app.get( '/users/:id', userApiRoutes.get );
 *
 * @license https://www.mozilla.org/MPL/2.0/ MPL-2.0
 *
 * @requires ../../models
 * @requires ../errors
 */

module.exports = function( env ) {
  var db = require( '../../models' )( env );
  var errorResponse = require( '../errors' )( env );

  return {
    /**
     * Create a new user.
     *
     * There is no restriction on what kinds of users can create new users.
     *
     * Note: `req.body` must be an object containing the data for the new user.
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse} res
     */
    create: function( req, res ) {
      return db.User.create( req.body ).done( function( err, user ) {
        if( err && err.name === 'SequelizeUniqueConstraintError' ) {
          return errorResponse.conflict( req, res, 'User account already exists.' );
        }

        if( err ) {
          return errorResponse.internal( req, res, err );
        }

        res.status( 200 ).json( user );
      });
    },
    /**
     * Get a specific users details.
     *
     * Only the user who's details are being requested, or an administrator, can
     * retrieve the user details.
     *
     * Note: `req.params.id` must be the id for the user to fetch.
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse} res
     */
    get: function( req, res ) {
      if( ( req.session.user.id === parseInt( req.params.id, 10 ) ) || ( req.session.user.isAdmin ) ) {
        return db.User.find( req.params.id ).done( function( err, user ) {
          if( err ) {
            return errorResponse.internal( req, res, err );
          }

          res.status( 200 ).json( user );
        });
      }

      return errorResponse.forbidden( req, res );
    },
    /**
     * Gets an array of all users.
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse} res
     */
    list: function( req, res ) {
      if( req.session.user.isAdmin ) {
        return db.User.findAll().done( function( err, users ) {
          if( err ) {
            return errorResponse.internal( req, res, err );
          }

          res.status( 200 ).json( users );
        });
      }

      return errorResponse.forbidden( req, res );
    },
    /**
     * Update a specific users details.
     *
     * Only the user who's details are being updated can modify all details. Administrators
     * may only edit a users email address and admin status.
     *
     * Note: `req.body` must be an object containing the data for the new user, and
     * `req.params.id` must be the id for the user to update.
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse} res
     */
    update: function( req, res ) {
      if( req.session.user.id === parseInt( req.params.id, 10 ) ) {
        return db.User.find( req.params.id ).done( function( err, user ) {
          if( err ) {
            return errorResponse.internal( req, res, err );
          }

          user.updateAttributes( req.body ).done( function( err, user ) {
            if( err ) {
              return errorResponse.internal( req, res, err );
            }

            res.status( 200 ).json( user );
          });
        });
      }

      if( req.session.user.isAdmin ) {
        return db.User.find( req.params.id ).done( function( err, user ) {
          if( err ) {
            return errorResponse.internal( req, res, err );
          }

          user.updateAttributes( req.body, [ 'email', 'isAdmin' ] ).done( function( err, user ) {
            if( err ) {
              return errorResponse.internal( req, res, err );
            }

            res.status( 200 ).json( user );
          });
        });
      }

      return errorResponse.forbidden( req, res );
    },
    /**
     * Delete a specific user.
     *
     * Only the user who's details will be removed, or an adminstrator, may remove
     * the user specified.
     *
     * Note: `req.params.id` must be the id for the user to delete.
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse} res
     */
    delete: function( req, res ) {
      if( ( req.session.user.id === parseInt( req.params.id, 10 ) ) || ( req.session.user.isAdmin ) ) {
        return db.User.find( req.params.id ).done( function( err, user ) {
          if( err ) {
            return errorResponse.internal( req, res, err );
          }

          user.destroy().done( function( err ) {
            if( err ) {
              return errorResponse.internal( req, res, err );
            }

            res.status( 204 ).end();
          });
        });
      }

      return errorResponse.forbidden( req, res );
    },
    /**
     * List all topics belonging to a specific user.
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse} res
     */
    topics: function( req, res ) {
      if( req.session.user.id === parseInt( req.params.id, 10 ) ) {
        return db.Topic.findAll({
          where: {
            UserId: req.params.id
          }
        }).done( function( err, topics ) {
          if( err ) {
            return errorResponse.internal( req, res, err );
          }

          res.status( 200 ).json( topics );
        });
      }

      return errorResponse.forbidden( req, res );
    },
    /**
     * Lists all the tasks that belong to a specific user.
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse} res
     */
    tasks: function( req, res ) {
      if( req.session.user.id === parseInt( req.params.id, 10 ) ) {
        return db.Task.findAll({
          where: {
            UserId: req.params.id
          }
        }).done( function( err, tasks ) {
          if( err ) {
            return errorResponse.internal( req, res, err );
          }

          res.status( 200 ).json( tasks );
        });
      }

      return errorResponse.forbidden( req, res );
    }
  };
};
