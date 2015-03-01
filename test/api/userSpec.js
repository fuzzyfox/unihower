/* global describe, it, before, after */

/**
 * @file BDD tests for the user API, when a user is autenticated but not an admin.
 * @module test/api/userSpec
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

describe( '/api/users (for standard user)', function() {
  // any pre-test setup
  before( function( done ) {
    this.timeout( 10000 );
    test.setupDatabase( function( err ) {
      if( err ) {
        return done( err );
      }

      test.setupPersonaForUserById( 2, function( err ) {
        if( err ) {
          return done( err );
        }

        test.loginPersonaUserById( 2, done );
      });
    });
  });

  // any post-test teardown
  after( function( done ) {
    test.logoutPersonaUser( function( err ) {
        if( err ) {
          return done( err );
        }

        test.destroyPersonaUserById( 2, done );
    });
  });

  it( 'GET should exist', function( done ) {
    test.agent
      .get( '/api/users' )
      .set( 'Accept', 'application/json' )
      .expect( 'Content-Type', /json/ )
      .expect( 403 )
      .end( done );
  });

  it( 'POST should create a valid user object', function( done ) {
    var newUser = {
      name: 'John Doe',
      email: 'j.doe@restmail.net'
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

  it( 'POST should NOT create an admin user', function( done ) {
    var newUser = {
      name: 'Jane Doe',
      email: 'jane.doe@restmail.net',
      isAdmin: true
    };

    test.agent
      .post( '/api/users' )
      .send( newUser )
      .set( 'Accept', 'application/json' )
      .expect( 'Content-Type', /json/ )
      .expect( 401 )
      .end( done );
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
        name: 'Jane Doe'
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

    it( 'PUT should NOT update a user to become an admin', function( done ) {
      var newUser = {
        name: 'Jane Doe',
        isAdmin: true
      };

      test.agent
        .put( '/api/users/2' )
        .send( newUser )
        .set( 'Acept', 'application/json' )
        .expect( 401 )
        .end( done );
    });

    it( 'DETLETE should remove a user', function( done ) {
      test.agent
        .delete( '/api/users/2' )
        .expect( 204 )
        .end( done );
    });
  });
});
