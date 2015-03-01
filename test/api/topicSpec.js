/* global describe, it, before, after */

/**
 * @file BDD tests for the topic API
 * @module test/api/topicSpec
 *
 * @license https://www.mozilla.org/MPL/2.0/ MPL-2.0
 */

// force testing env
process.env.NODE_ENV = 'testing';

var test = require( '../_testSetup' );
require( 'chai' ).should();

/*
  describe topic api
 */

describe( '/api/topics', function() {
  // any pre-test setup
  before( function( done ) {
    this.timeout( 10000 );
    test.setupDatabase( function( err ) {
      if( err ) {
        return done( err );
      }

      test.setupPersonaForUserById( 2, function( err ) {
        if( err ) {
          return done( err );
        }

        test.loginPersonaUserById( 2, done );
      });
    });
  });

  // any post-test teardown
  after( function( done ) {
    test.logoutPersonaUser( function( err ) {
        if( err ) {
          return done( err );
        }

        test.destroyPersonaUserById( 2, done );
    });
  });

  it( 'GET should exist', function( done ) {
    test.agent
      .get( '/api/topics' )
      .set( 'Accept', 'application/json' )
      .expect( 'Content-Type', /json/ )
      .expect( 403 )
      .end( done );
  });

  it( 'POST should create a valid topic object', function( done ) {
    var newTopic = {
      name: 'Operation Waning Orca',
      description: 'A topic created simply to test topic creation.'
    };

    test.agent
      .post( '/api/topics' )
      .send( newTopic )
      .set( 'Accept', 'application/json' )
      .expect( 'Content-Type', /json/ )
      .expect( 200 )
      .end( function( err, res ) {
        if( err ) {
          return done( err );
        }
        test.validateAgainstModel( 'Topic', res.body, done );
      });
  });

  describe( '/api/topics/1', function() {

    it( 'GET should exist', function( done ) {
      test.agent
        .get( '/api/topics/1' )
        .set( 'Accept', 'application/json' )
        .expect( 'Content-Type', /json/ )
        .expect( 200 )
        .end( done );
    });

    it( 'GET should return a valid topic object', function( done ) {
      test.agent
        .get( '/api/topics/1' )
        .set( 'Accept', 'application/json' )
        .expect( 'Content-Type', /json/ )
        .expect( 200 )
        .end( function( err, res ) {
          if( err ) {
            return done( err );
          }
          test.validateAgainstModel( 'Topic', res.body, done );
        });
    });

    it( 'PUT should update a topic', function( done ) {
      var newTopic = {
        name: 'Meta Topic Is Meta'
      };

      test.agent
        .put( '/api/topics/1' )
        .send( newTopic )
        .set( 'Acept', 'application/json' )
        .expect( 200 )
        .end( function( err, res ) {
          if( err ) {
            return done( err );
          }
          test.validateAgainstModel( 'Topic', res.body, done );
        });
    });

    it( 'DELETE should remove a topic', function( done ) {
      test.agent
        .delete( '/api/topics/1' )
        .expect( 204 )
        .end( done );
    });
  });

  describe( '/api/users/2/topics', function() {
    it( 'GET should exist', function( done ) {
      test.agent
        .get( '/api/users/2/topics' )
        .set( 'Acept', 'application/json' )
        .expect( 'Content-Type', /json/ )
        .expect( 200 )
        .end( done );
    });

    it( 'GET should return an array of valid topic objects beloning to UserId 2', function( done ) {
      test.agent
        .get( '/api/users/2/topics' )
        .set( 'Acept', 'application/json' )
        .expect( 'Content-Type', /json/ )
        .expect( 200 )
        .end( function( err, res ) {
          if( err ) {
            return done( err );
          }

          var tested = 0;
          var errs = [];
          res.body.forEach( function( obj ) {
            obj.UserId.should.equal( 2 );
            test.validateAgainstModel( 'Topic', obj, function( err ) {
              tested++;

              if( err ) {
                errs.push( err );
              }

              if( tested === res.body.length && ! errs.length ) {
                done();
              }
              else if( tested === res.body.length ) {
                done( errs );
              }
            });
          });
        });
    });
  });
});
