/**
 * @file Provides logic for loading Tasks http routes.
 * @module routes/tasks
 *
 * @license https://www.mozilla.org/MPL/2.0/ MPL-2.0
 *
 * @requires models
 * @requires routes/errors
 */

/**
 * Task route handlers.
 *
 * @example
 *
 *  // assuming you've loaded an environment into `env`
 *  var taskRoutes = require( './routes/tasks' )( env );
 *
 *  app.get( '/tasks/create', taskRoutes.create );
 *  app.get( '/tasks/:id', taskRoutes.topic );
 *
 * @param  {Habitat} env An instance of a habitat environment manipulator.
 * @return {Object}      An object contaning all the HTTP route handlers for tasks.
 */
module.exports = function( env ) {
  var db = require( '../models' )( env );
  var errorResponse = require( './errors' )( env );
  var debug = require( 'debug' )( 'routes:tasks' );
  var lodash = require( 'lodash' );

  return {
    /**
     * Handle requests for a listing of ALL tasks.
     *
     * **Note:** Will only load listing for tasks belonging to the user.
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse}  res
     */
    tasks: function( req, res ) {
      debug( 'Get ALL tasks for user %d', req.session.user.id );

      return db.Task.findAll({
        where: {
          UserId: req.session.user.id
        },
        include: [ db.Topic ]
      }).done( function( err, tasks ) {
        if( err ) {
          debug( 'ERROR: Failed to get tasks. (err, session)' );
          debug( err, req.session );

          return errorResponse.internal( req, res, err );
        }

        res.render( 'tasks/tasks.html', { tasks: tasks } );
      });
    },
    /**
     * Handle requests for a specific tasks.
     *
     * **Note:** Will only load tasks belonging to the current user.
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse}  res
     */
    task: function( req, res ) {
      debug( 'Get task: %d', req.params.id );

      return db.Task.find({
        where: {
          id: req.params.id,
        },
        include: [ db.Topic ]
      }).done( function( err, task ) {
        if( err ) {
          debug( 'ERROR: Failed to get task. (err, taskId)' );
          debug( err, req.params.id );

          return errorResponse.internal( req, res, err );
        }

        if( ! task ) {
          return errorResponse.notFound( req, res );
        }

        if( task.UserId !== req.session.user.id ) {
          return errorResponse.forbidden( req, res );
        }

        res.render( 'tasks/task.html', JSON.parse( JSON.stringify( task ) ) );
      });
    },
    /**
     * Handle requests for task creation form.
     *
     * Loads a listing of all topics belonging to the current user so that they
     * can be presented as a part of the form.
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse}  res
     */
    create: function( req, res ) {
      debug( 'Get task creation form.' );

      return db.Topic.findAll({
        where: {
          UserId: req.session.user.id
        }
      }).done( function( err, topics ) {
        if( err ) {
          debug( 'ERROR: Failed to load user %d\'s topics. (err, userId)' );
          debug( err, req.session.user.id );

          return errorResponse.internal( req, res, err );
        }

        res.render( 'tasks/create.html', { query: req.query, topics: topics } );
      });
    },
    /**
     * Handle requests for task update form.
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse}  res
     */
    update: function( req, res ) {
      debug( 'Update task: %d', req.params.id );

      return db.Task.find({
        where: {
          id: req.params.id,
        },
        include: [ db.Topic ]
      }).done( function( err, task ) {
        if( err ) {
          debug( 'ERROR: Failed to get task. (err, taskId)' );
          debug( err, req.params.id );

          return errorResponse.internal( req, res, err );
        }

        if( ! task ) {
          return errorResponse.notFound( req, res );
        }

        if( task.UserId !== req.session.user.id ) {
          return errorResponse.forbidden( req, res );
        }

        return db.Topic.findAll({
          where: {
            UserId: req.session.user.id
          }
        }).done( function( err, topics ) {
          if( err ) {
            debug( 'ERROR: Failed to load user %d\'s topics. (err, userId)' );
            debug( err, req.session.user.id );

            return errorResponse.internal( req, res, err );
          }

          res.render( 'tasks/create.html', lodash.extend( JSON.parse( JSON.stringify( task ) ), {
            query: req.query,
            topics: topics
          }) );
        });
      });
    },
    /**
     * Handle request for listing of a users "deleted" topics.
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse}  res
     */
    trash: function( req, res ) {
      debug( 'Get deleted tasks.' );

      // all tasks that have been "deleted"
      var where = {
        UserId: req.session.user.id,
        deletedAt: { $ne: null }
      };

      // filter even more by Topic
      if( req.query.topic ) {
        where.TopicId = req.query.topic;
      }

      // run query on db for tasks
      return db.Task.findAll({
        where: where,
        include: [ db.Topic ],
        paranoid: false
      }).done( function( err, tasks ) {
        // database error
        if( err ) {
          debug( 'ERROR: Failed to get deleted tasks from db. (err)' );
          return debug( err );
        }

        res.render( 'tasks/trash.html', { tasks: tasks, topicId: req.query.topic } );
      });
    }
  };
};
