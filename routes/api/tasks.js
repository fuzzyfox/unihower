/**
 * @file Provides handlers for task api routes.
 *
 * @example
 *   var taskApiRoutes = require( './routes/api/tasks' )( env );
 *   app.get( '/tasks/:id', taskApiRoutes.get );
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
     * Create a new task.
     *
     * Once a task is created it is automatically associated to the user that
     * created it.
     *
     * Note: `req.body` must be an object containing the data for the new task.
     *
     * To assign a task directly to a topic pass the `TopicId` parameter along
     * within `req.body`.
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse} res
     */
    create: function( req, res ) {
      return db.Task.create( req.body ).done( function( err, task ) {
        if( err ) {
          return errorResponse.internal( req, res, err );
        }

        task.setUser( req.session.user.id ).done( function( err, user ) {
          if( err ) {
            return errorResponse.internal( req, res, err );
          }

          res.status( 200 ).json( task );
        });
      });
    },
    /**
     * Get a specific tasks details.
     *
     * Only the user who's details are being requested, can retrieve the task details.
     *
     * Note: `req.params.id` must be the id for the task to fetch.
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse} res
     */
    get: function( req, res ) {
      return db.Task.find( req.params.id ).done( function( err, task ) {
        if( err ) {
          return errorResponse.internal( req, res, err );
        }

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
     * @param  {http.ServerResponse} res
     */
    list: function( req, res ) {
      return errorResponse.forbidden( req, res );
    },
    /**
     * Update a specific tasks details.
     *
     * Only the user who's details are being updated can modify details.
     *
     * Note: `req.body` must be an object containing the data for the new task, and
     * `req.params.id` must be the id for the task to update.
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse} res
     */
    update: function( req, res ) {
      return db.Task.find( req.params.id ).done( function( err, task ) {
        if( err ) {
          return errorResponse.internal( req, res, err );
        }

        if( task.UserId !== req.session.user.id ) {
          return errorResponse.forbidden( req, res, err );
        }

        task.updateAttributes( req.body ).done( function( err, task ) {
          if( err ) {
            return errorResponse.internal( req, res, err );
          }

          res.status( 200 ).json( task );
        });
      });
    },
    /**
     * Delete a specific task.
     *
     * Only the user who's task details will be removed, may remove the specified task.
     *
     * Note: `req.params.id` must be the id for the task to delete.
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse} res
     */
    delete: function( req, res ) {
      return db.Task.find( req.params.id ).done( function( err, task ) {
        if( err ) {
          return errorResponse.internal( req, res, err );
        }

        if( task.UserId !== req.session.user.id ) {
          return errorResponse.forbidden( req, res );
        }

        task.destroy().done( function( err ) {
          if( err ) {
            return errorResponse.internal( req, res, err );
          }

          res.status( 204 ).end();
        });
      });
    }
  };
};