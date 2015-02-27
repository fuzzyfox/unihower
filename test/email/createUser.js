/* global describe, it, before, after */

/**
 * @file BDD tests for the new user email
 * @module test/email/createUser
 *
 * @license https://www.mozilla.org/MPL/2.0/ MPL-2.0
 */

// force testing env
process.env.NODE_ENV = 'testing';

/*
  require packages
 */
var Habitat = require( 'habitat' );
var supertest = require( 'supertest' );
var request = require( 'request' );
require( 'chai' ).should();

// load environment
Habitat.load( process.cwd() + '/.env-test' );
var env = new Habitat();
// laod package into env
env.set( 'pkg', require( process.cwd() + '/package' ) );

// get instance of server app + models
var app = require( process.cwd() + '/server' );
var db = require( process.cwd() + '/models' )( env );

// configure supertest
var agent = supertest.agent( app );
var restmail = supertest( 'http://restmail.net' );

/**
 * Determines if `res.body` is a valid user object, and throws an error if one
 * is encountered by the tests.
 *
 * @param  {http.IncomingMessge} res
 */
function validUserObject( res ) {
  // valid (required) properties and their types for a user object
  var keyTypes = {
    id: 'number',
    name: 'string',
    email: 'string',
    isAdmin: 'boolean',
    sendNotifications: 'boolean',
    createdAt: 'string',
    updatedAt: 'string'
  };

  // check that the property exists and is of correct type
  Object.keys( keyTypes ).forEach( function( key ) {
    res.body.should.have.property( key ).and.be.a( keyTypes[ key ] );
  });

  // check if last login datetime exists, and if so that its type string
  if( res.body.lastLogin ) {
    res.body.lastLogin.should.be.a( 'string' );
  }
}

/**
 * Setup the database with clean slate, and test data
 *
 * @param  {Function} done Async callback for mocha
 */
function setupDatabase( done ) {
  db.ready( function() {
    db.User.bulkCreate( require( '../data/user' ) ).done( function() {
      done();
    }).catch( function( err ) {
      done( err );
    });
  });
}

/*
  describe user api
 */

describe( '/api/users (new user)', function() {
  // any pre-test setup
  before( function( done ) {
    this.timeout( 3000 );
    // setup test db
    setupDatabase( function( err ) {
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
    agent
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

    agent
      .post( '/api/users' )
      .send( newUser )
      .set( 'Accept', 'application/json' )
      .expect( 'Content-Type', /json/ )
      .expect( 200 )
      .expect( validUserObject )
      .end( done );
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
          res.body[ 0 ].should.be.an( 'object' ).with.property( 'subject' ).and.equal( 'Welcome to Eisenhower.' );
        })
        .end( done );
    }, 1000 );
  });
});
