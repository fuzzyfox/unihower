module.exports = function( env ) {
  var db = require( '../models' )( env );
  var errorResponse = require( './errors' )( env );
  var debug = require( 'debug' )( 'routes:tasks' );

  return {
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
    }
  };
};
