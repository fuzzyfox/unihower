/**
 * @file Provides handlers for user api routes.
 * @module routes/api/users
 *
 * @license https://www.mozilla.org/MPL/2.0/ MPL-2.0
 *
 * @requires models
 * @requires email
 * @requires routes/errors
 */

/**
 * User API exports
 *
 * @example
 *
 *  // assuming you've loaded an environment into `env`
 *  var userApiRoutes = require( './routes/api/users' )( env );
 *
 *  // uses the `update` method to handle the request.
 *  app.put( '/api/users/:id', userApiRoutes.update );
 *
 * @param  {Habitat} env An instance of a habitat environment manipulator.
 * @return {Object}      An object containing all user api route handlers.
 */
module.exports = function( env ) {
  var db = require( '../../models' )( env );
  var errorResponse = require( '../errors' )( env );
  var email = require( '../../libs/email' )( env );
  var lodash = require( 'lodash' );
  var debug = require( 'debug' )( 'api:users' );

  return {
    /**
     * Create a new user.
     *
     * There is no restriction on what kinds of users can create new users.
     *
     * **Note:** `req.body` must be an object containing the data for the new user.
     *
     * *Method intended for HTTP POST requests*
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse}  res
     */
    create: function( req, res ) {
      debug( 'Create user: %s', req.body.email );

      // prevent creation of administrator accounts by anyone but administrators
      if( req.body.hasOwnProperty( 'isAdmin' ) && ( req.session.user && ! req.session.user.isAdmin ) ) {
        return errorResponse.unauthorized( req, res, 'You must be an administrator to perform that action.' );
      }

      // create user
      return db.User.create( req.body ).done( function( err, user ) {
        // on user collision error
        if( err && err.name === 'SequelizeUniqueConstraintError' ) {
          return errorResponse.conflict( req, res, 'User account already exists.' );
        }

        // database error
        if( err ) {
          debug( 'ERROR: Failed to create user. (err, body)' );
          debug( err, req.body );

          return errorResponse.internal( req, res, err );
        }

        // send welcome email
        email.send( user.id, 'user_created' );

        // respond w/ new user details
        res.status( 200 ).json({ user: user });
      });
    },
    /**
     * Get a specific users details.
     *
     * Only the user who's details are being requested, or an administrator, can
     * retrieve the user details.
     *
     * **Note:** `req.params.id` must be the id for the user to fetch.
     *
     * *Method intended for HTTP GET requests.*
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse}  res
     */
    get: function( req, res ) {
      debug( 'Get user: %d', req.params.id );

      // ensure requesting own details OR an admin making request
      if( ( req.session.user.id === parseInt( req.params.id, 10 ) ) || ( req.session.user.isAdmin ) ) {
        if( req.session.user.isAdmin ) {
          debug( '↳ Getting user as Admin' );
        }

        // search database for details
        return db.User.find( req.params.id ).done( function( err, user ) {
          // database error finding user
          if( err ) {
            debug( 'ERROR: Failed to find user. (err, userId)' );
            debug( err, req.params.id );

            return errorResponse.internal( req, res, err );
          }

          // user not found
          if( !user ) {
            return errorResponse.notFound( req, res );
          }

          res.status( 200 ).json({ user: user });
        });
      }

      return errorResponse.forbidden( req, res );
    },
    /**
     * Gets an array of all users.
     *
     * **Note:** only Administrators may view a list of system users.
     *
     * *Method intended for HTTP GET requests.*
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse}  res
     */
    list: function( req, res ) {
      debug( 'Get ALL users' );

      // ensure admin making request
      if( req.session.user.isAdmin ) {
        // find all users in databse
        return db.User.findAll().done( function( err, users ) {
          // database error
          if( err ) {
            debug( 'ERROR: Failed to findAll users. (err)' );
            debug( err );

            return errorResponse.internal( req, res, err );
          }

          // return database results
          res.status( 200 ).json({ users: users });
        });
      }

      // naughty non-admin
      return errorResponse.forbidden( req, res );
    },
    /**
     * Update a specific users details.
     *
     * Only the user who's details are being updated can modify all details.
     * Administrators may only edit a users email address and admin status.
     *
     * **Note:** `req.body` must be an object containing the data for the new
     * user, and `req.params.id` must be the id for the user to update.
     *
     * *Method intended for HTTP PUT/POST requests.*
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse}  res
     */
    update: function( req, res ) {
      debug( 'Update user: %d', req.params.id );

      // handle user making request to update selves
      if( req.session.user.id === parseInt( req.params.id, 10 ) ) {
        debug( '↳ User updating own record.' );
        // prevent non-administrators making others (or themselves administrators)
        if( req.body.hasOwnProperty( 'isAdmin' ) && ( req.session.user && ! req.session.user.isAdmin ) ) {
          return errorResponse.unauthorized( req, res, 'You must be an administrator to perform that action.' );
        }

        // find user in database
        return db.User.find( req.params.id ).done( function( err, user ) {
          // database error
          if( err ) {
            debug( 'ERROR: Failed to find user. (err, userId)' );
            debug( err, req.params.id );

            return errorResponse.internal( req, res, err );
          }

          // user not found
          if( !user ) {
            return errorResponse.notFound( req, res );
          }

          // update user details
          user.updateAttributes( req.body ).done( function( err, user ) {
            // database error while updating
            if( err ) {
              debug( 'ERROR: Failed to update user. (err, body)' );
              debug( err, req.body );

              return errorResponse.internal( req, res, err );
            }

            res.status( 200 ).json({ user: user });
          });
        });
      }

      // handle admin making update to another user
      if( req.session.user.isAdmin ) {
        debug( '↳ Admin updating user record.' );

        // convert isAdmin into a boolean (damn sequelize not doing this for us)
        req.body.isAdmin = /^(1|t(rue)?|y(es)?)$/i.test( req.body.isAdmin );

        // find user we want to update
        return db.User.find( req.params.id ).done( function( err, user ) {
          // database error finding user
          if( err ) {
            debug( 'ERROR: Failed to find user. (err, userId)' );
            debug( err, req.params.id );

            return errorResponse.internal( req, res, err );
          }

          // user not found
          if( !user ) {
            return errorResponse.notFound( req, res );
          }

          // update user details (force remove any changes but those to email and admin flag)
          user.updateAttributes( req.body, { fields: [ 'email', 'isAdmin' ] } ).done( function( err, user ) {
            // database error making request
            if( err ) {
              debug( 'ERROR: Failed to update user. (err, body)' );
              debug( err, req.body );

              return errorResponse.internal( req, res, err );
            }

            res.status( 200 ).json({ user: user });
          });
        });
      }

      // naughty non-admin
      return errorResponse.forbidden( req, res );
    },
    /**
     * Delete a specific user.
     *
     * Only the user who's details will be removed, or an adminstrator, may remove
     * the user specified.
     *
     * **Note:** `req.params.id` must be the id for the user to delete.
     *
     * *Method intended for HTTP DELETE requests.*
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse}  res
     */
    delete: function( req, res ) {
      debug( 'Destroy user: %d', req.params.id );

      // check user deleting selves OR admin deleting another user
      if( ( req.session.user.id === parseInt( req.params.id, 10 ) ) || ( req.session.user.isAdmin ) ) {

        // find user in database
        return db.User.find( req.params.id ).done( function( err, user ) {
          // database error finding user
          if( err ) {
            debug( 'ERROR: Failed to find user. (err, userId)' );
            debug( err, req.params.id );

            return errorResponse.internal( req, res, err );
          }

          // user not found
          if( !user ) {
            return errorResponse.notFound( req, res );
          }

          // delete user
          user.destroy().done( function( err ) {
            if( err ) {
              debug( 'ERROR: Failed to destroy user. (err, userId)' );
              debug( err, req.params.id );

              return errorResponse.internal( req, res, err );
            }

            res.status( 204 ).end();
          });
        });
      }

      // naughty non-admin
      return errorResponse.forbidden( req, res );
    },
    /**
     * List all topics belonging to a specific user.
     *
     * **Note:* a user may only view their own topics.
     *
     * *Method intended for HTTP GET requests.*
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse}  res
     */
    topics: function( req, res ) {
      debug( 'Get user %d\'s topics.', req.params.id );

      // check user requesting own data
      if( req.session.user.id === parseInt( req.params.id, 10 ) ) {
        return db.Topic.findAll({
          where: {
            UserId: req.params.id
          },
          include: {
            model: db.Task,
            attributes: [ 'id' ]
          }
        }).done( function( err, topics ) {
          // database error finding topics
          if( err ) {
            debug( 'ERROR: Failed to find user\'s topics. (err, userId)' );
            debug( err, req.params.id );

            return errorResponse.internal( req, res, err );
          }

          // adjust tasks format for emberjs RESTAdapter
          topics.forEach( function( topic, idx ) {
            delete topic.dataValues.Tasks;
            topic.dataValues.tasks = lodash.map( lodash.map( topic.Tasks, 'dataValues' ), 'id' );
          });

          // return results
          res.status( 200 ).json({ topics: topics });
        });
      }

      // naughty user
      return errorResponse.forbidden( req, res );
    },
    /**
     * Lists all the tasks that belong to a specific user.
     *
     * **Note:** a user may only view their own tasks.
     *
     * *Method intended for HTTP GET requests.*
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse}  res
     */
    tasks: function( req, res ) {
      debug( 'Get user %d\'s associated tasks.', req.params.id );

      // ensure user requesting own data
      if( req.session.user.id === parseInt( req.params.id, 10 ) ) {
        return db.Task.findAll({
          where: {
            UserId: req.params.id
          }
        }).done( function( err, tasks ) {
          // database error finding tasks
          if( err ) {
            debug( 'ERROR: Failed to find user\'s tasks. (err, userId)' );
            debug( err, req.params.id );

            return errorResponse.internal( req, res, err );
          }

          // return results
          res.status( 200 ).json({ tasks: tasks });
        });
      }

      // naughty user
      return errorResponse.forbidden( req, res );
    }
  };
};
