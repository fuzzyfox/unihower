/**
 * @file Provides handlers for task api routes.
 * @module routes/api/tasks
 *
 * @license https://www.mozilla.org/MPL/2.0/ MPL-2.0
 *
 * @requires models
 * @requires routes/errors
 */

/**
 * Task API exports
 *
 * @example
 *
 *  // assuming you've loaded an environment into `env`
 *  var taskApiRoutes = require( './routes/api/tasks' )( env );
 *
 *  // uses the `delete` method to handle the request.
 *  app.delete( '/api/tasks/:id', taskApiRoutes.delete );
 *
 * @param  {Habitat} env An instance of a habitat environment manipulator.
 * @return {Object}      An object containing all user api route handlers.
 */
module.exports = function( env ) {
  var db = require( '../../models' )( env );
  var errorResponse = require( '../errors' )( env );
  var debug = require( 'debug' )( 'api:tasks' );

  return {
    /**
     * Create a new task.
     *
     * Once a task is created it is automatically associated to the user that
     * created it.
     *
     * **Note:** `req.body` must be an object containing the data for the new task.
     *
     * To assign a task directly to a topic pass the `TopicId` parameter along
     * within `req.body`.
     *
     * *Method intended for HTTP POST requests.*
     *
     * @todo prevent users adding tasks to topics they do not own.
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse}  res
     */
    create: function( req, res ) {
      debug( 'Create task: %s', req.body.description );

      // find user
      return db.User.find( req.session.user.id ).done( function( err, user ) {
        // database error finding user
        if( err ) {
          debug( 'ERROR: Failed to get user to associate to. (err, body, session)' );
          debug( err, req.body, req.session );

          return errorResponse.internal( req, res, err );
        }

        // only way there will be no user at this stage is if the user has just
        // been removed while the create topic request was being made
        //
        // user is forbidden from performing action now
        if( !user ) {
          return errorResponse.forbidden( req, res );
        }

        // build task from given data and add to user
        user.addTask( db.Task.build( req.body ) ).done( function( err, task ) {
          // database error creating task
          if( err ) {
            debug( 'ERROR: Failed to create task. (err, body)' );
            debug( err, req.body );

            return errorResponse.internal( req, res, err );
          }

          res.status( 200 ).json( task );
        });
      });
    },
    /**
     * Get a specific tasks details.
     *
     * Only the user who's details are being requested, can retrieve the task
     * details.
     *
     * **Note:** `req.params.id` must be the id for the task to fetch.
     *
     * *Method intended for HTTP GET requests.*
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse}  res
     */
    get: function( req, res ) {
      debug( 'Get task: %d', req.params.id );

      // find task
      return db.Task.find( req.params.id ).done( function( err, task ) {
        // database error finding task
        if( err ) {
          debug( 'ERROR: Failed to find task. (err, taskId)' );
          debug( err, req.params.id );

          return errorResponse.internal( req, res, err );
        }

        // task not found
        if( !task ) {
          return errorResponse.notfound( req, res );
        }

        // task does not belong to user
        if( task.UserId !== req.session.user.id ) {
          return errorResponse.forbidden( req, res );
        }

        res.status( 200 ).json( task );
      });
    },
    /**
     * Returns a 403 forbidden instead of all task listing.
     *
     * This function is here as a placeholder for consistency in the API. No
     * user should be able to access anothers task details.
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse}  res
     */
    list: function( req, res ) {
      return errorResponse.forbidden( req, res );
    },
    /**
     * Update a specific tasks details.
     *
     * Only the user who's details are being updated can modify details.
     *
     * **Note:** `req.body` must be an object containing the data for the new task,
     * and `req.params.id` must be the id for the task to update.
     *
     * *Method intended for HTTP PUT/POST requests.*
     *
     * @todo prevent users adding tasks to topics they do not own.
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse}  res
     */
    update: function( req, res ) {
      debug( 'Update task: %d', req.params.id );

      // find task
      return db.Task.find( req.params.id ).done( function( err, task ) {
        // database error while finding task
        if( err ) {
          debug( 'ERROR: Failed to find task. (err, params, session)' );
          debug( err, req.params, req.session );

          return errorResponse.internal( req, res, err );
        }

        // task not found
        if( !task ) {
          return errorResponse.notfound( req, res );
        }

        // task does not belong to user
        if( task.UserId !== req.session.user.id ) {
          return errorResponse.forbidden( req, res, err );
        }

        // update task
        task.updateAttributes( req.body ).done( function( err, task ) {
          // database error while updating task
          if( err ) {
            debug( 'ERROR: Failed to update task. (err, body)' );
            debug( err, req.body );

            return errorResponse.internal( req, res, err );
          }

          res.status( 200 ).json( task );
        });
      });
    },
    /**
     * Delete a specific task.
     *
     * Only the user who's task details will be removed, may remove the
     * specified task.
     *
     * **Note:** `req.params.id` must be the id for the task to delete.
     *
     * *Method intended for HTTP DELETE requests.*
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse}  res
     */
    delete: function( req, res ) {
      debug( 'Destroy task: %d', req.params.id );

      // find task
      return db.Task.find( req.params.id ).done( function( err, task ) {
        // database error finding task
        if( err ) {
          debug( 'ERROR: Failed to find task. (err, taskId)' );
          debug( err, req.params.id );

          return errorResponse.internal( req, res, err );
        }

        // task not found
        if( !task ) {
          return errorResponse.notfound( req, res );
        }

        // task does not belong to user
        if( task.UserId !== req.session.user.id ) {
          return errorResponse.forbidden( req, res );
        }

        // delete task
        task.destroy().done( function( err ) {
          // database error while deleting task
          if( err ) {
            debug( 'ERROR: Failed to destroy task. (err, taskId)' );
            debug( err, req.params.id );

            return errorResponse.internal( req, res, err );
          }

          res.status( 204 ).end();
        });
      });
    }
  };
};
