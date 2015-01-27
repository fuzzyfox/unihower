module.exports = function( env ) {
  var db = require( '../models' )( env );
  var errorResponse = require( './errors' )( env );

  return {
    tasks: function( req, res ) {
      return db.Task.findAll({
        where: {
          UserId: req.session.user.id
        },
        include: [ db.Topic ]
      }).done( function( err, tasks ) {
        if( err ) {
          return errorResponse.internal( req, res, err );
        }

        res.render( 'tasks/tasks.html', { tasks: tasks } );
      });
    },
    task: function( req, res ) {
      return db.Task.find({
        where: {
          id: req.params.id,
        },
        include: [ db.Topic ]
      }).done( function( err, task ) {
        if( err ) {
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
      return db.Topic.findAll({
        where: {
          UserId: req.session.user.id
        }
      }).done( function( err, topics ) {
        if( err ) {
          return errorResponse.internal( req, res, err );
        }

        res.render( 'tasks/create.html', { query: req.query, topics: topics } );
      });
    }
  };
};
