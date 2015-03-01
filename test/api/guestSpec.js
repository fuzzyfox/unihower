/* global describe, it, before */

/**
 * @file BDD tests for the user API, when the user is not authenticated
 * @module test/api/non-userSpec
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

describe( '/api/users (guest user)', function() {
  before( test.setupDatabase );

  it( 'GET should exist', function( done ) {
    test.agent
      .get( '/api/users' )
      .set( 'Accept', 'application/json' )
      .expect( 'Content-Type', /json/ )
      .expect( 401 )
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
});
