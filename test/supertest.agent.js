/* global describe, it */

// force testing env
process.env.NODE_ENV = 'testing';

/*
  require packages
 */
var supertest = require( 'supertest' );
var express = require( 'express' );
var app = express();
app.use( require( 'cookie-parser' )() );
require( 'chai' ).should();

// setup some special routes for this test
app.get( '/test/cookie', function( req, res ) {
  res.cookie( 'cookie', 'hey' );
  res.send( 'set cookie' );
});

app.get( '/test/returnCookie', function( req, res ) {
  if( req.cookies.cookie ) {
    return res.send( req.cookies.cookie );
  }

  res.send( 'fail' );
});

//  configure supertest
var agent = supertest.agent( app );

describe( 'supertest.agent(app)', function() {

  it( 'GET /test/cookie should save a cookie to agent', function( done ) {
    agent
      .get( '/test/cookie' )
      .expect( 200 )
      .expect('set-cookie', 'cookie=hey; Path=/' )
      .end( done );
  });

  it( 'GET /test/returnCookie should persist cookie back to server', function( done ) {
    agent
      .get( '/test/returnCookie' )
      .expect( 200 )
      .expect( 'hey' )
      .end( done );
  });
});
