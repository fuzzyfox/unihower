/* global describe, it */

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

// configure super test
supertest = supertest( 'http://localhost:' + env.get( 'port' ) );

/*
  describe a valid user object
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

/*
  describe user api
 */

/**
 * @todo authenticate as a standard user
 */
describe( '/api/users (for standard user)', function() {
  it( 'should exist', function( done ) {
    supertest
      .get( '/api/users' )
      .set( 'Accept', 'application/json' )
      .expect( 'Content-Type', /json/ )
      .expect( 401 )
      .end( done );
  });

  it( 'should create a valid user object', function( done ) {
    var newUser = {
      name: 'John Doe',
      email: 'j.doe@restmail.net'
    };

    supertest
      .post( '/api/users' )
      .send( newUser )
      .set( 'Accept', 'application/json' )
      .expect( 'Content-Type', /json/ )
      .expect( 200 )
      .expect( validUserObject )
      .end( done );
  });

  /**
   * @todo replace `$id` in URI's with valid UserId's
   */
  describe( '/api/users/{id}', function() {
    it( 'should exist', function( done ) {
      supertest
        .get( '/api/users/$id' )
        .set( 'Accept', 'application/json' )
        .expect( 'Content-Type', /json/ )
        .expect( 200 )
        .end( done );
    });

    it( 'should return a valid user object', function( done ) {
      supertest
        .get( '/api/users/$id' )
        .set( 'Accept', 'application/json' )
        .expect( 'Content-Type', /json/ )
        .expect( 200 )
        .expect( validUserObject )
        .end( done );
    });

    it( 'should update a user', function( done ) {
      var newUser = {
        name: 'Jane Doe'
      };

      supertest
        .put( '/api/users/$id' )
        .send( newUser )
        .set( 'Acept', 'application/json' )
        .expect( 200 )
        .expect( validUserObject )
        .end( done );
    });
  });
});
