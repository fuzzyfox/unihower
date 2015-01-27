module.exports = function( env ) {
  var db = require( '../models' )( env );
  var errorResponse = require( './errors' )( env );

  return {
    topics: function( req, res ) {
      return db.Topic.findAll({
        where: {
          UserId: req.session.user.id
        },
        include: [ db.Task ]
      }).done( function( err, topics ) {
        if( err ) {
          return errorResponse.internal( req, res, err );
        }

        res.render( 'topics/topics.html', { topics: topics } );
      });
    },
    topic: function( req, res ) {
      return db.Topic.find({
        where: {
          id: req.params.id
        },
        include: [ db.Task ]
      }).done( function( err, topic ) {
        if( err ) {
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
      res.render( 'topics/create.html' );
    }
  };
};
