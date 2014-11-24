/* global describe, it, before, after */

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

/*
  describe a valid topic object
 */
function validTaskObject( res ) {
  // valid (required) properties and their types for a topic object
  var keyTypes = {
    id: 'number',
    description: 'string',
    state: 'string',
    coordX: 'number',
    coordY: 'number',
    createdAt: 'string',
    updatedAt: 'string',
    UserId: 'number'
  };

  // check that the property exists and is of correct type
  Object.keys( keyTypes ).forEach( function( key ) {
    res.body.should.have.property( key ).and.be.a( keyTypes[ key ] );
  });
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
      db.Topic.bulkCreate( require( '../data/topic' ) ).done( function() {
        db.Task.bulkCreate( require( '../data/task' ) ).done( function() {
          done();
        }).catch( function( err ) {
          done( err );
        });
      }).catch( function( err ) {
        done( err );
      });
    }).catch( function( err ) {
      done( err );
    });
  });
}

/*
  describe task api
 */

describe( '/api/tasks', function() {
  // any pre-test setup
  before( function( done ) {
    // this bit can take a while
    this.timeout( 10000 );

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
    agent
      .post( '/persona/logout' )
      .set( 'Accept', 'application/json' )
      .expect( 'Content-Type', /json/ )
      .expect( 200 )
      .end( done );
  });

  it( 'GET should exist', function( done ) {
    agent
      .get( '/api/tasks' )
      .set( 'Accept', 'application/json' )
      .expect( 'Content-Type', /json/ )
      .expect( 403 )
      .end( done );
  });

  it( 'POST should create a valid task object', function( done ) {
    var newTask = {
      description: 'Triage inbox.',
      state: 'incomplete',
      coordX: Math.floor( Math.random() * 70 ),
      coordY: Math.floor( Math.random() * 70 )
    };

    agent
      .post( '/api/tasks' )
      .send( newTask )
      .set( 'Accept', 'application/json' )
      .expect( 'Content-Type', /json/ )
      .expect( 200 )
      .expect( validTaskObject )
      .end( done );
  });

  describe( '/api/tasks/1', function() {

    it( 'GET should exist', function( done ) {
      agent
        .get( '/api/tasks/1' )
        .set( 'Accept', 'application/json' )
        .expect( 'Content-Type', /json/ )
        .expect( 200 )
        .end( done );
    });

    it( 'GET should return a valid task object', function( done ) {
      agent
        .get( '/api/tasks/1' )
        .set( 'Accept', 'application/json' )
        .expect( 'Content-Type', /json/ )
        .expect( 200 )
        .expect( validTaskObject )
        .end( done );
    });

    it( 'PUT should update a task', function( done ) {
      var newTask = {
        state: 'complete'
      };

      agent
        .put( '/api/tasks/1' )
        .send( newTask )
        .set( 'Acept', 'application/json' )
        .expect( 200 )
        .expect( validTaskObject )
        .end( done );
    });

    it( 'DELETE should remove a task', function( done ) {
      agent
        .delete( '/api/tasks/1' )
        .expect( 204 )
        .end( done );
    });
  });

  describe( '/api/users/2/tasks', function() {
    it( 'GET should exist', function( done ) {
      agent
        .get( '/api/users/2/tasks' )
        .set( 'Acept', 'application/json' )
        .expect( 'Content-Type', /json/ )
        .expect( 200 )
        .end( done );
    });

    it( 'GET should return an array of valid tasks objects beloning to UserId 2', function( done ) {
      agent
        .get( '/api/users/2/tasks' )
        .set( 'Acept', 'application/json' )
        .expect( 'Content-Type', /json/ )
        .expect( 200 )
        .expect( function( res ) {
          res.body.forEach( function( obj ) {
            validTaskObject( { body: obj } );
          });
        })
        .end( done );
    });

    it( 'GET should return an array of valid tasks beloning to TopicId 2', function( done ) {

    });
  });
});
