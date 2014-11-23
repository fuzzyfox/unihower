/* global describe, it */

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

// configure super test
var app = require( process.cwd() + '/server' );
var agent = supertest.agent( app );

describe( '/healthcheck', function() {
  it( 'should exist and return json', function( done ) {
    agent
      .get( '/healthcheck' )
      .set( 'Accept', 'application/json' )
      .expect( 'Content-Type', /json/ )
      .expect( 200 )
      .end( done );
  });

  it( 'should have the current package version number', function( done ) {
    agent
      .get( '/healthcheck' )
      .set( 'Accept', 'application/json' )
      .expect( 'Content-Type', /json/ )
      .expect( 200 )
      .expect( function( res ) {
        res.body.should.have.property( 'version' ).with.string( env.get( 'pkg' ).version );
        return false; // return false on success
      })
      .end( done );
  });

  it( 'should have http property as "okay"', function( done ) {
    agent
      .get( '/healthcheck' )
      .set( 'Accept', 'application/json' )
      .expect( 'Content-Type', /json/ )
      .expect( 200 )
      .expect( function( res ) {
        res.body.should.have.property( 'http' ).with.string( 'okay' );
        return false; // return false on success
      })
      .end( done );
  });
});
