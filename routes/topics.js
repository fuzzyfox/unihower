module.exports = function( env ) {
  var db = require( '../models' )( env );
  var errorResponse = require( './errors' )( env );
  var debug = require( 'debug' )( 'routes:topics' );

  return {
    topics: function( req, res ) {
      debug( 'Get ALL topics for user %d', req.session.user.id );

      return db.Topic.findAll({
        where: {
          UserId: req.session.user.id
        },
        include: [ db.Task ]
      }).done( function( err, topics ) {
        if( err ) {
          debug( 'ERROR: Failed to get topics. (err, session)' );
          debug( err, req.session );

          return errorResponse.internal( req, res, err );
        }

        res.render( 'topics/topics.html', { topics: topics } );
      });
    },
    topic: function( req, res ) {
      debug( 'Get topic: %d', req.params.id );

      return db.Topic.find({
        where: {
          id: req.params.id
        },
        include: [ db.Task ]
      }).done( function( err, topic ) {
        if( err ) {
          debug( 'ERROR: Failed to get topic. (err, taskId)' );
          debug( err, req.params.id );

          return errorResponse.internal( req, res, err );
        }

        if( !topic ) {
          return errorResponse.notFound( req, res );
        }

        if( topic.UserId !== req.session.user.id ) {
          return errorResponse.forbidden( req, res );
        }

        res.render( 'topics/topic.html', JSON.parse( JSON.stringify( topic ) ) );
      });
    },
    create: function( req, res ) {
      debug( 'Get topic creation form.' );

      res.render( 'topics/create.html' );
    }
  };
};
