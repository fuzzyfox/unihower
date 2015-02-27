/* global describe, it, before */

/**
 * @file BDD tests for the user API, when the user is not authenticated
 * @module test/api/non-userSpec
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
  descripbe user api
 */

describe( '/api/users (guest user)', function() {
  before( setupDatabase );

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
      name: 'John Doe',
      email: 'j.doe@restmail.net'
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

  it( 'POST should NOT create an admin user', function( done ) {
    var newUser = {
      name: 'Jane Doe',
      email: 'jane.doe@restmail.net',
      isAdmin: true
    };

    agent
      .post( '/api/users' )
      .send( newUser )
      .set( 'Accept', 'application/json' )
      .expect( 'Content-Type', /json/ )
      .expect( 401 )
      .end( done );
  });
});
