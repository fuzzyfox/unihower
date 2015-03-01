/* global describe, it, before, after */

/**
 * @file BDD tests for the user API, when the user is authenticated and an admin.
 * @module test/api/adminSpec
 *
 * @license https://www.mozilla.org/MPL/2.0/ MPL-2.0
 */

 // force testing env
 process.env.NODE_ENV = 'testing';

 var test = require( '../_testSetup' );
 require( 'chai' ).should();

 /*
   describe user api
  */

describe( '/api/users (for administrator)', function() {
  // any pre-test setup
  before( function( done ) {
    this.timeout( 10000 );
    test.setupDatabase( function( err ) {
      if( err ) {
        return done( err );
      }

      test.setupPersonaForUserById( 1, function( err ) {
        if( err ) {
          return done( err );
        }

        test.loginPersonaUserById( 1, done );
      });
    });
  });

  // any post-test teardown
  after( function( done ) {
    test.logoutPersonaUser( function( err ) {
        if( err ) {
          return done( err );
        }

        test.destroyPersonaUserById( 1, done );
    });
  });

  it( 'GET should exist', function( done ) {
    test.agent
      .get( '/api/users' )
      .set( 'Accept', 'application/json' )
      .expect( 'Content-Type', /json/ )
      .expect( 200 )
      .end( done );
  });

  it( 'POST should create an admin user', function( done ) {
    var newUser = {
      name: 'John Doe',
      email: 'j.doe@restmail.net',
      isAdmin: true
    };

    test.agent
      .post( '/api/users' )
      .send( newUser )
      .set( 'Accept', 'application/json' )
      .expect( 'Content-Type', /json/ )
      .expect( 200 )
      .end( function( err, res ) {
        if( err ) {
          return done( err );
        }

        test.validateAgainstModel( 'User', res.body, done );
      });
  });

  it( 'GET should get an array of valid user objects', function( done ) {
    test.agent
      .get( '/api/users' )
      .set( 'Accept', 'application/json' )
      .expect( 'Content-Type', /json/ )
      .expect( 200 )
      .end( function( err, res ) {
        if( err ) {
          return done( err );
        }

        var tested = 0;
        var errs = [];
        res.body.forEach( function( obj ) {
          test.validateAgainstModel( 'User', obj, function( err ) {
            tested++;

            if( err ) {
              errs.push( err );
            }

            if( tested === res.body.length && ! errs.length ) {
              done();
            }
            else if( tested === res.body.length ) {
              done( errs );
            }
          });
        });
      });
  });

  describe( '/api/users/2', function() {

    it( 'GET should exist', function( done ) {
      test.agent
        .get( '/api/users/2' )
        .set( 'Accept', 'application/json' )
        .expect( 'Content-Type', /json/ )
        .expect( 200 )
        .end( done );
    });

    it( 'GET should return a valid user object', function( done ) {
      test.agent
        .get( '/api/users/2' )
        .set( 'Accept', 'application/json' )
        .expect( 'Content-Type', /json/ )
        .expect( 200 )
        .end( function( err, res ) {
          if( err ) {
            return done( err );
          }

          test.validateAgainstModel( 'User', res.body, done );
        });
    });

    it( 'PUT should update a user', function( done ) {
      var newUser = {
        email: 'jane.doe@restmail.net'
      };

      test.agent
        .put( '/api/users/2' )
        .send( newUser )
        .set( 'Acept', 'application/json' )
        .expect( 200 )
        .end( function( err, res ) {
          if( err ) {
            return done( err );
          }

          test.validateAgainstModel( 'User', res.body, done );
        });
    });

    it( 'DETLETE should remove a user', function( done ) {
      test.agent
        .delete( '/api/users/2' )
        .expect( 204 )
        .end( done );
    });
  });
});
