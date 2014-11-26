/* global describe, it, before, after */

/**
 * @file BDD tests for the user API, when a user is autenticated but not an admin.
 * @module test/api/userSpec
 *
 * @license https://www.mozilla.org/MPL/2.0/ MPL-2.0
 */

// force testing env
process.env.NODE_ENV = 'testing';

/*
  require packages
 */
var Habitat = require( 'habitat' );
var request = require( 'request' );
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
  db.sequelize.sync( { force: true } ).complete( function( err ) {
    if( err ) {
      return done( err );
    }

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

var personatestuser = {};

describe( '/api/users (for standard user)', function() {
  // any pre-test setup
  before( function( done ) {
    // this bit can take a while
    this.timeout( 30000 );

    // setup database with test data
    setupDatabase( function( err ) {
      if( err ) {
        return done( err );
      }

      /*
        get persona test user for auth w/ local api
       */

      // make request for test user from remote api (personatestuser.org)
      // documentation of remote api at <https://github.com/mozilla/personatestuser.org>
      request
        .get({
          url: 'http://personatestuser.org/email_with_assertion/' + encodeURIComponent( 'http://localhost:' + env.get( 'port' ) ),
          json: true
        }, function( err, res, body ) {
          if( err ) {
            return done( err );
          }

          personatestuser = body;

          // change the email address of user 2 to match that from persona so we can
          // log the user into the api (downside of persona auth)
          db.User.find( 2 ).done( function( err, user ) {
            if( err ) {
              return done( err );
            }

            user.email = body.email;
            user.save().done( function( err ) {
              if( err ) {
                console.log( err );
                return done( err );
              }

              // send the assertion we got from the remote api to our
              // persona verification route
              agent
                .post( '/persona/verify' )
                .send( { assertion: body.assertion } )
                .set( 'Accept', 'application/json' )
                .expect( 'Content-Type', /json/ )
                .expect( 200 )
                .expect( function( res ) {
                  if( res.body.status === 'okay' ) {
                    return; // return void if successful
                  }

                  throw new Error( 'persona verification failed' );
                })
                .end( done );
            }).catch( function( err ) {
              done( err );
            });
          }).catch( function( err ) {
            done( err );
          });
        });
    });
  });

  after( function( done ) {
    // remove persona test user to tidy up remote api session
    request
      .get({
        url: 'http://personatestuser.org/cancel/' + personatestuser.email + '/' + personatestuser.password,
        json: true
      }, function( err, res, body ) {
        // logout to remove our local api session
        agent
          .post( '/persona/logout' )
          .set( 'Accept', 'application/json' )
          .expect( 'Content-Type', /json/ )
          .expect( 200 )
          .end( done );
      });
  });

  it( 'GET should exist', function( done ) {
    agent
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

    agent
      .post( '/api/users' )
      .send( newUser )
      .set( 'Accept', 'application/json' )
      .expect( 'Content-Type', /json/ )
      .expect( 200 )
      .expect( validUserObject )
      .end( done );
  });

  describe( '/api/users/2', function() {

    it( 'GET should exist', function( done ) {
      agent
        .get( '/api/users/2' )
        .set( 'Accept', 'application/json' )
        .expect( 'Content-Type', /json/ )
        .expect( 200 )
        .end( done );
    });

    it( 'GET should return a valid user object', function( done ) {
      agent
        .get( '/api/users/2' )
        .set( 'Accept', 'application/json' )
        .expect( 'Content-Type', /json/ )
        .expect( 200 )
        .expect( validUserObject )
        .end( done );
    });

    it( 'PUT should update a user', function( done ) {
      var newUser = {
        name: 'Jane Doe'
      };

      agent
        .put( '/api/users/2' )
        .send( newUser )
        .set( 'Acept', 'application/json' )
        .expect( 200 )
        .expect( validUserObject )
        .end( done );
    });

    it( 'DETLETE should remove a user', function( done ) {
      agent
        .delete( '/api/users/2' )
        .expect( 204 )
        .end( done );
    });
  });
});
