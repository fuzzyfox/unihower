/* global describe, it, before, after */

/**
 * @file BDD tests for the email library
 * @module test/email/lib
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

// get instance of email lib + models
var db = require( process.cwd() + '/models' )( env );
var email = require( process.cwd() + '/libs/email' )( env );

// configure supertest
var restmail = supertest( 'http://restmail.net' );

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
  describe library
 */
describe( 'MODULE: lib/email', function() {
  // pre-test setup
  before( function( done ) {
    this.timeout( 3000 );
    // setup database
    setupDatabase( function( err ) {
      if( err ) {
        return done( err );
      }

      // clear up any potential emails on restmail's servers
      db.User.findAll().done( function( err, users ) {
        if( err ) {
          return done( err );
        }

        var doneCount = 0;
        function partDone( err, res ) {
          if( err ) {
            throw err;
          }

          doneCount++;

          if( doneCount === users.length ) {
            done();
          }
        }

        users.forEach( function( user ) {
          restmail
            .delete( '/mail/' + user.email.replace( '@restmail.net', '' ) )
            .expect( 200 )
            .end( partDone );
        });
      });
    });
  });

  // post-test cleanup
  after( function( done ) {
    this.timeout( 3000 );
    db.User.findAll().done( function( err, users ) {
      if( err ) {
        return done( err );
      }

      var doneCount = 0;
      function partDone( err, res ) {
        if( err ) {
          throw err;
        }

        doneCount++;

        if( doneCount === users.length ) {
          done();
        }
      }

      users.forEach( function( user ) {
        restmail
          .delete( '/mail/' + user.email.replace( '@restmail.net', '' ) )
          .expect( 200 )
          .end( partDone );
      });
    });
  });

  /*
    describe email#sendRaw()
   */
  describe( '#sendRaw()', function() {
    it( 'should send an email to a user w/ sendNotifications = true', function( done ) {
      this.timeout( 3000 );

      var subject = 'Test email#sendRaw';
      var message = 'This is an automated test email';

      email.sendRaw( 1, { subject: subject }, message, function( err, info ) {
        if( err ) {
          throw err;
        }

        db.User.find( 1 ).done( function( err, user ) {
          if( err ) {
            throw err;
          }

          // wait a second for message to send
          restmail
            .get( '/mail/' + user.email.replace( '@restmail.net', '' ) )
            .set( 'Accept', 'application/json' )
            .expect( 'Content-Type', /json/ )
            .expect( 200 )
            .expect( function( res ) {
              res.body.should.be.an( 'array' ).with.length( 1 );
              res.body[ 0 ].should.be.an( 'object' ).with.property( 'subject' ).and.equal( subject );
              res.body[ 0 ].should.be.an( 'object' ).with.property( 'text' ).and.equal( message + '\n' );
            })
            .end( done );
        });
      });
    });

    it( 'should not send email to a user w/ sendNotifications = false', function( done ) {
      var subject = 'Test email#sendRaw';
      var message = 'This is an automated test email';

      email.sendRaw( 5, { subject: subject }, message, function( err, info ) {
        if( !err ) {
          throw new Error( 'Test failed to yeild error.' );
        }

        err.should.be.an( 'object' ).with.property( 'message' ).and.equal( 'User not accepting email.' );

        done();
      });
    });
  });

  /*
    describe email#sendBulkRaw()
   */
  describe( '#sendBulkRaw()', function() {
    it( 'should send email to multiple users w/ sendNotifications = true', function( done ) {
      this.timeout( 5000 );

      var subject = 'Test email#sendBulkRaw';
      var message = 'This is an automated test email';

      email.sendBulkRaw( [ 10, 2, 3 ], { subject: subject }, message, function( err, info ) {
        err.should.be.an( 'array' ).with.length( 0 );

        db.User.findAll({
          where: {
            id: [ 10, 2, 3 ]
          }
        }).done( function( err, users ) {
          if( err ) {
            throw err;
          }

          var doneCount = 0;
          function partDone( err, res ) {
            if( err ) {
              throw err;
            }

            doneCount++;

            if( doneCount === users.length ) {
              done();
            }
          }

          users.forEach( function( user ) {
            restmail
              .get( '/mail/' + user.email.replace( '@restmail.net', '' ) )
              .set( 'Accept', 'application/json' )
              .expect( 'Content-Type', /json/ )
              .expect( 200 )
              .expect( function( res ) {
                res.body.should.be.an( 'array' ).with.length( 1 );
                res.body[ 0 ].should.be.an( 'object' ).with.property( 'subject' ).and.equal( subject );
                res.body[ 0 ].should.be.an( 'object' ).with.property( 'text' ).and.equal( message + '\n' );
              })
              .end( partDone );
          });
        });
      });
    });

    it( 'should not send emails to multiple users w/ sendNotifications = false', function( done ) {
      var subject = 'Test email#sendBulkRaw';
      var message = 'This is an automated test email';

      email.sendBulkRaw( [ 5, 6, 7 ], { subject: subject }, message, function( err, info ) {
        if( !err && !info ) {
          return done();
        }

        if( err.length ) {
          throw new Error( 'Test yeilded errors.' );
        }

        throw new Error( 'Test resulted in emails being sent.' );
      });
    });
  });
});
