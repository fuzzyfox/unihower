module.exports = function( env ) {
  var db = require( '../models' )( env );
  var errorResponse = require( './errors' )( env );
  var debug = require( 'debug' )( 'routes:users' );

  return {
    users: function( req, res ) {
      debug( 'Getting ALL users.' );

      if( req.session.user.isAdmin ) {
        return db.User.findAll().done( function( err, users ) {
          if( err ) {
            debug( 'ERROR: Failed to get users. (err)' );
            debug( err );

            return errorResponse.internal( req, res, err );
          }

          res.render( 'users/users.html', { users: users } );
        });
      }

      return errorResponse.forbidden( req, res );
    },
    user: function( req, res ) {
      debug( 'Get user: %d', req.params.id );

      if( ( req.session.user.id === parseInt( req.params.id, 10 ) ) || ( req.session.user.isAdmin ) ) {
        if(req.session.user.isAdmin) {
          debug( '↳ Getting user as Admin' );
        }

        return db.User.find( req.params.id ).done( function( err, user ) {
          if( err ) {
            debug( 'ERROR: Failed to get user. (err, userId)' );
            debug( err, req.params.id );

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
      debug( 'Get user creation form.' );

      if( req.session.user.id && !req.session.user.isAdmin ) {
        debug( '↳ User session exists and non-admin, redirect to user details.' );

        res.redirect( '/users/' + req.session.user.id );
      }

      res.render( 'users/create.html' );
    }
  };
};
