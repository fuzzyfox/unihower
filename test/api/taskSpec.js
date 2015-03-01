/* global describe, it, before, after */

/**
 * @file BDD tests for the task API
 * @module test/api/taskSpec
 *
 * @license https://www.mozilla.org/MPL/2.0/ MPL-2.0
 */

 // force testing env
 process.env.NODE_ENV = 'testing';

 var test = require( '../_testSetup' );
 require( 'chai' ).should();

 /*
   describe user api
  */

describe( '/api/tasks', function() {
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

    test.agent
      .post( '/api/tasks' )
      .send( newTask )
      .set( 'Accept', 'application/json' )
      .expect( 'Content-Type', /json/ )
      .expect( 200 )
      .end( function( err, res ) {
        if( err ) {
          return done( err );
        }

        test.validateAgainstModel( 'Task', res.body, done );
      });
  });

  describe( '/api/tasks/1', function() {

    it( 'GET should exist', function( done ) {
      test.agent
        .get( '/api/tasks/1' )
        .set( 'Accept', 'application/json' )
        .expect( 'Content-Type', /json/ )
        .expect( 200 )
        .end( done );
    });

    it( 'GET should return a valid task object', function( done ) {
      test.agent
        .get( '/api/tasks/1' )
        .set( 'Accept', 'application/json' )
        .expect( 'Content-Type', /json/ )
        .expect( 200 )
        .end( function( err, res ) {
          if( err ) {
            return done( err );
          }

          test.validateAgainstModel( 'Task', res.body, done );
        });
    });

    it( 'PUT should update a task', function( done ) {
      var newTask = {
        state: 'complete'
      };

      test.agent
        .put( '/api/tasks/1' )
        .send( newTask )
        .set( 'Acept', 'application/json' )
        .expect( 200 )
        .end( function( err, res ) {
          if( err ) {
            return done( err );
          }

          test.validateAgainstModel( 'Task', res.body, done );
        });
    });

    it( 'DELETE should remove a task', function( done ) {
      test.agent
        .delete( '/api/tasks/1' )
        .expect( 204 )
        .end( done );
    });
  });

  describe( '/api/users/2/tasks', function() {
    it( 'GET should exist', function( done ) {
      test.agent
        .get( '/api/users/2/tasks' )
        .set( 'Acept', 'application/json' )
        .expect( 'Content-Type', /json/ )
        .expect( 200 )
        .end( done );
    });

    it( 'GET should return an array of valid tasks objects beloning to UserId 2', function( done ) {
      test.agent
        .get( '/api/users/2/tasks' )
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
            obj.should.have.property( 'UserId' ).and.equal( 2 );
            test.validateAgainstModel( 'Task', obj, function( err ) {
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

  describe( '/api/topics/2/tasks', function() {
    it( 'GET should exist', function( done ) {
      test.agent
        .get( '/api/topics/2/tasks' )
        .set( 'Acept', 'application/json' )
        .expect( 'Content-Type', /json/ )
        .expect( 200 )
        .end( done );
    });

    it( 'GET should return an array of valid tasks objects beloning to TopicId 2', function( done ) {
      test.agent
        .get( '/api/topics/2/tasks' )
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
            obj.should.have.property( 'TopicId' ).and.equal( 2 );
            test.validateAgainstModel( 'Task', obj, function( err ) {
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
