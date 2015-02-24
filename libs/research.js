/**
 * @file Enables the collection of data for use in research.
 *
 * This works by using hooks into the database ORM (sequelize) and recording a
 * copy of all data being created/retrieved/destroyed by users of the system.
 * Data is then recorded into a seperate table with the type of action occuring
 * to it, and can be processed later.
 *
 * Note: A "study" must be configured in the environment for this all to happen.
 *
 * @module research
 *
 * @todo turn on/off functionality based on a study timeframe
 *
 * @license https://www.mozilla.org/MPL/2.0/ MPL-2.0
 */

var debug = require( 'debug' )( 'research' );
var moment = require( 'moment' );

/**
 * Research Lib Export
 *
 * @param  {Object}  app An ExpressJS application object.
 * @param  {Habitat} env An instance of a habitat environment manipulator.
 * @return {Function}    Function to enable manually adding data.
 */
module.exports = function( app, env ) {
  if( !env.get( 'study_name' ) ) {
    debug( 'No study to collect for.' );
    return function() {};
  }

  // get database, and study details
  var db = require( '../models' )( env );
  var study = env.get( 'study' );

  // validate start time and check if we've passed it before allowing research
  // data to be collected
  if( study.start && ( !moment( study.start ).isValid() || moment( study.start ).isAfter( moment() ) ) ) {
    return function() {};
  }

  // validate finish time and check if we've passed it before allowing research
  // data to be collected
  if( study.finish && ( !moment( study.finish ).isValid() || moment( study.finish ).isBefore( moment() ) ) ) {
    return function() {};
  }

  debug( 'Collecting data for study.\n' +
         '   Study: %s\n' +
         '   Start: %s\n' +
         '  Finish: %s', study.name, study.start, study.finish );

  /*
    Automated snooping (database)
   */
  var hooksToSnoopWith = [ 'afterCreate', 'afterFind', 'afterUpdate', 'afterDestroy' ];
  // setup snooping on all models
  Object.keys( db.sequelize.models ).forEach( function( sourceModel ) {
    // no no, you nasty infinite loop potential :P
    if( sourceModel === 'ResearchData' ) {
      return;
    }

    // don't bother with User model... differnt method code for that
    if( sourceModel === 'User' ) {
      return;
    }

    // snoop using predefined hooks
    hooksToSnoopWith.forEach( function( hookType ) {
      db[ sourceModel ].hook( hookType, function( data ) {
        // if no data found we cant log anything from the db hooks
        if( !data ) {
          return;
        }

        // attempt to determine the user this action related too
        var userId = data.UserId;

        db.User.find( userId ).done( function( err, user ) {
          if( err ) {
            debug( 'ERROR: Failed to find user. (err, userId)' );
            return debug( err, userId );
          }

          // if no user result found fail safely by not logging data
          if( !user || !user.email ){
            return debug( 'Refusing to snoop on data as user prefs cannot be determined.' );
          }

          // check user is happy to participate in research
          if( !user.researchParticipant ) {
            return debug( 'Refusing to snoop on data due to user prefs.' );
          }

          // save research data
          db.ResearchData.create({
            study: study.name,
            UserId: user.id,
            sourceModel: sourceModel,
            action: hookType.replace( /(after|before)/i,  '' ),
            data: JSON.stringify( data )
          }).done( function( err, record ) {
            if( err ) {
              debug( 'ERROR: Failed to save research data. (err)' );
              return debug( err );
            }
          });
        });
      });
    });
  });

  /*
    Automated snooping (http)
   */
  app.all( '*', function( req, res, next ) {
    if( req.session.user.id && req.session.user.researchParticipant ) {
      return db.ResearchData.create({
        study: study.name,
        UserId: req.session.user.id,
        action: 'HTTP-' + req.method,
        data: req.originalUrl,
        method: 'http intercept'
      }).done( function( err, record ) {
        if( err ) {
          debug( 'ERROR: Failed to save research data. (err)' );
          debug( err );
          return next();
        }

        next();
      });
    }

    if( req.session.user.id ) {
      debug( 'Refusing to snoop on data due to user prefs.' );
      return next();
    }

    debug( 'Refusing to snoop on data as user prefs cannot be determined.' );

    next();
  });

  /**
   * Manual addition of data into research.
   *
   * All data added to the research material must be added due to user actions,
   * and needs to be processable by `JSON.stringify()`.
   *
   * @param  {Object} user          db.User instance.
   * @param  {Mixed}  data          data to store for research usage.
   * @param  {String} [action]      type of action affecting data.
   * @param  {String} [sourceModel] model the data originally belonged to.
   * @param  {String} [method]      method by which the data was collected. Defaults to 'hard coded'.
   */
  return function( user, data, action, sourceModel, method ) {
    if( user.researchParticipant ) {
      db.ResearchData.create({
        UserId: user.id,
        sourceModel: sourceModel,
        action: action,
        data: JSON.stringify( data ),
        method: method || 'hard coded'
      });
    }
  };
};
