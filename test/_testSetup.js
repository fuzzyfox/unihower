/**
 * @file contains a collection of commonly used setup methods for tests.
 * @module test/testSetup
 *
 * @license https://www.mozilla.org/MPL/2.0/ MPL-2.0
 */

// Force testing environment
process.env.NODE_ENV = 'testing';

/**
 * Current Working Directory.
 * @type {String}
 */
var cwd = process.cwd();

/**
 * Habitat environment management library.
 * @type {Habitat}
 */
var Habitat = require( 'habitat' );
Habitat.load( cwd + '/.env-test' );

/**
 * Habitat enviroment manger instance.
 * @type {Habitat}
 */
var env = new Habitat();
env.set( 'pkg', require( cwd + '/package' ) );

/**
 * Server application instance.
 * @type {Express}
 */
var app = require( cwd + '/server' );

/**
 * Database ORM instance.
 * @type {Sequelize}
 */
var db = require( cwd + '/models' )( env );

/**
 * Supertest library.
 * @type {Supertest}
 */
var supertest = require( 'supertest' );

/**
 * Request library.
 * @type {Request}
 */
var request = require( 'request' );

/**
 * Supertest agent.
 * @type {Supertest.agent}
 */
var agent = supertest.agent( app );

/**
 * Validate that an object is valid against a model.
 *
 * @param {String}   modelName Name of the model to validate against
 * @param {Object}   obj       Object to validate
 * @param {Function} done      Done callback function
 */
function validateAgainstModel( modelName, obj, done ) {
  db[ modelName ].build( obj ).validate().done( function( err ) {
    if( err ) {
      return done( err );
    }

    done();
  });
}

/**
 * Setup the testing database with test data
 *
 * @param {Function} done Done callback function.
 */
function setupDatabase( done ) {
  try {
    // cannot use `db.ready` here as we need to ensure clean db state
    // on each call of this function.
    db.sequelize.sync({ force: env.get( 'db_force_sync' ) }).done( function( err ) {
      if( err ) {
        return done( err );
      }

      db.User.bulkCreate( require( './data/user' ) ).done( function() {
        db.Topic.bulkCreate( require( './data/topic' ) ).done( function() {
          db.Task.bulkCreate( require( './data/task' ) ).done( function() {
            done();
          });
        });
      });
    });
  }
  catch( err ) {
    done( err );
  }
}

/**
 * Map of Persona test user instances.
 * @type {Object}
 */
var personaTestUsers = {};

/**
 * Setup a valid Mozilla Persona user for testing.
 *
 * This uses the Persona test user api at:
 * <http://personatestuser.org/>
 *
 * Documentation for the Persona test user api can be found at:
 * <https://github.com/personatestuser.org>
 *
 * @param {Number}   userId ID of a user to setup persona for.
 * @param {Function} done   Done callback function.
 */
function setupPersonaForUserById( userId, done ) {
  request.get({
    url: 'http://personatestuser.org/email_with_assertion/' + encodeURIComponent( 'http://localhost:' + env.get( 'port' ) ),
    json: true
  }, function( err, res, body ) {
    if( err ) {
      return done( err );
    }

    personaTestUsers[ userId ] = body;
    db.User.find( userId ).done( function( err, user ) {
      if( err ) {
        return done( err );
      }
      // change email address of user to match that from the Persona
      // testing api
      user.email = body.email;
      user.save().done( function( err ) {
        if( err ) {
          return done( err );
        }
        done();
      });
    });
  });
}

/**
 * Login a user with Mozilla Persona.
 *
 * @param {Number}   userId ID of a user w/ persona test account.
 * @param {Function} done   Done callback function.
 */
function loginPersonaUserById( userId, done ) {
  agent
    .post( '/persona/verify' )
    .send( { assertion: personaTestUsers[ userId ].assertion } )
    .set( 'Accept', 'application/json' )
    .expect( 'Content-Type', /json/ )
    .expect( 200 )
    .expect( function( res ) {
      if( res.body.status === 'okay' ) {
        return; // void return on success
      }

      throw new Error( 'Persona verification failed.' );
    })
    .end( done );
}

/**
 * Logout a user with Mozilla Persona.
 *
 * @param {Function} done   Done callback function.
 */
function logoutPersonaUser( done ) {
  agent
    .post( '/persona/logout' )
    .send()
    .set( 'Accept', 'application/json' )
    .expect( 'Content-Type', /json/ )
    .expect( 200 )
    .end( done );
}

function destroyPersonaUserById( userId, done ) {
  request.get({
    url: 'http://personatestuser.org/cancel/' + personaTestUsers[ userId ].email + '/' + personaTestUsers[ userId ].password,
    json: true
  }, function( err, res, body ) {
    if( err ) {
      return done( err );
    }
    done();
  });
}

/**
 * Test Setup Exports
 * @type {Object}
 */
module.exports = {
  agent: agent,
  app: app,
  db: db,
  env: env,
  setupDatabase: setupDatabase,
  validateAgainstModel: validateAgainstModel,
  setupPersonaForUserById: setupPersonaForUserById,
  destroyPersonaUserById: destroyPersonaUserById,
  loginPersonaUserById: loginPersonaUserById,
  logoutPersonaUser: logoutPersonaUser
};
