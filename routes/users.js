module.exports = function( env ) {
  var db = require( '../models' )( env );
  var errorResponse = require( './errors' )( env );

  return {
    users: function( req, res ) {
      if( req.session.user.isAdmin ) {
        return db.User.findAll().done( function( err, users ) {
          if( err ) {
            return errorResponse.internal( req, res, err );
          }

          res.render( 'users/users.html', { users: users } );
        });
      }

      return errorResponse.forbidden( req, res );
    },
    user: function( req, res ) {
      if( ( req.session.user.id === parseInt( req.params.id, 10 ) ) || ( req.session.user.isAdmin ) ) {
        return db.User.find( req.params.id ).done( function( err, user ) {
          if( err ) {
            return errorResponse.internal( req, res, err );
          }

          if( !user ) {
            return errorResponse.notFound( req, res );
          }

          res.render( 'users/user.html', JSON.parse( JSON.stringify( user ) ) );
        });
      }

      return errorResponse.forbidden( req, res );
    },
    create: function( req, res ) {
      if( req.session.user.id ) {
        res.redirect( '/users/' + req.session.user.id );
      }

      res.render( 'users/create.html' );
    }
  };
};
