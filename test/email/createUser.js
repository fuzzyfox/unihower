/* global describe, it, before, after */

/**
 * @file BDD tests for the new user email
 * @module test/email/createUser
 *
 * @license https://www.mozilla.org/MPL/2.0/ MPL-2.0
 */

// force testing env
process.env.NODE_ENV = 'testing';

var test = require( '../_testSetup' );
var request = require( 'request' );
var supertest = require( 'supertest' );
var restmail = supertest( 'http://restmail.net' );
require( 'chai' ).should();

/*
  describe user api
 */

describe( '/api/users (new user)', function() {
  // any pre-test setup
  before( function( done ) {
    this.timeout( 10000 );
    test.setupDatabase( function( err ) {
      if( err ) {
        return done( err );
      }

      // clear up any potential emails on restmail's servers for user "eisenhower"
      restmail
        .delete( '/mail/eisenhower' )
        .expect( 200 )
        .end( done );
    });
  });

  // any post-test cleanup
  after( function( done ) {
    // remove test emails on restmail's servers
    request
      .del( 'http://restmail.net/mail/eisenhower', function( err ) {
        if( err ) {
          return done( err );
        }

        done();
      });
  });

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
      name: 'Dwight Eisenhower',
      email: 'eisenhower@restmail.net'
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

  it( 'GET should send a welcome email to the new user', function( done ) {
    this.timeout( 5000 );

    // allow a second for mail to be sent
    setTimeout( function() {
      restmail
        .get( '/mail/eisenhower' )
        .set( 'Accept', 'application/json' )
        .expect( 'Content-Type', /json/ )
        .expect( 200 )
        .expect( function( res ) {
          res.body.should.be.an( 'array' ).with.length( 1 );
          res.body[ 0 ].should.be.an( 'object' ).with.property( 'subject' ).and.equal( require( '../../emailTemplates/userCreated' ).subject );
        })
        .end( done );
    }, 1000 );
  });
});
