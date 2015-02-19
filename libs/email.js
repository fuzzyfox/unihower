/**
 * @file Contains all the logic for sending emails to users from generating emails
 * from templates, to actually sending the emails.
 * @module email
 *
 * @todo Make mail transport configurable
 * @todo Enable the sending of non-templated emails
 *
 * @license https://www.mozilla.org/MPL/2.0/ MPL-2.0
 *
 * @requires models
 */

/**
 * Email library exports
 *
 * @param  {Habitat} env An instance of a habitat environment manipulator.
 * @return {Object}      An object containing all the HTTP error handlers.
 */
module.exports = function( env ) {
  var debug = require( 'debug' )( 'email' );
  // nodemailer requirement
  var nodemailer = require( 'nodemailer' );
  var transport = nodemailer.createTransport();
  // ORM
  var db = require( '../models' )( env );
  // lodash
  var lodash = require( 'lodash' );
  // nunjucks
  var nunjucks = require( 'nunjucks' );
  var nunjucksEnv = nunjucks.configure( 'emailTemplates', {
    autoescape: true,
    watch: true
  });
  // add website var to nunjucks
  nunjucksEnv.addGlobal( 'website', env.get( 'persona_audience' ).replace( /:\d+$/i, '' ) );

  return {
    /**
     * Send email to a user (based on their ID)
     *
     * Will send the given message to the email address of the user (from the db)
     * and provide user data as a nunjucks context for the message.
     *
     * Email will only be sent if the user has `sendNotifications` set to TRUE.
     *
     * @param  {Number}   userId  ID of user to send to
     * @param  {String}   message The message to send (must be defined in ../emailTemplates)
     * @param  {Function} [done]  Nodemailer transport.sendMail callback
     */
    send: function( userId, message, done ) {
      done = done || function() {};

      var meta = require( '../emailTemplates/' + message );

      db.User.find( userId ).done( function( err, user ) {
        // database error
        if( err ) {
          debug( 'ERROR: Failed to get user. (err, userId)' );
          debug( err, userId );
          return done( err );
        }

        // no user found
        if( !user ) {
          debug( 'ERROR: User %d not found in database.', userId );
          return done( new Error( 'User not found.' ) );
        }

        // user requested no emails
        if( !user.sendNotifications ) {
          debug( 'WARN: Refusing to send email to user based on preferences' );
          return done( new Error( 'User not accepting email.' ) );
        }

        // construct message options
        var msgOptions = {
          // email going to user.email
          to: {
            address: user.email
          },
          from: env.get( 'email_from' ),
          subject: meta.subject
        };

        if( user.name ) {
          // if user has a name add that in too
          msgOptions.to.name = user.name;
        }

        // render message with user data as context
        msgOptions.text = nunjucks.render( message + '/message.txt', {
          user: user,
          meta: meta
        });

        // send email
        transport.sendMail( msgOptions, function( err, info ) {
          if( err ) {
            debug( 'ERROR: Failed to send email "%s" to "%s". (err)', meta.subject, user.email );
            debug( err );
          }

          // now we've done some debug pass through callback
          done( err, info );
        });
      });
    },
    /**
     * Bulk send an email to specified users.
     *
     * Will send the given message to the email addresses of the users (from the db)
     * and provide user data as a nunjucks context for the message per user.
     *
     * Emails will only be sent to users with `sendNotifications` set to TRUE.
     *
     * @param  {Array}   userIds An array of user IDs
     * @param  {String}   message The message to send (must be defined in ../emailTemplates)
     * @param  {Function} done    Array of results from nodemailer transport.sendMail callbacks
     */
    bulkSend: function( userIds, message, done ) {
      done = done || function() {};

      var meta = require( '../emailTemplates/' + message );

      db.User.findAll({
        where: {
          id: userIds
        }
      }).done( function( err, users ) {
        // database error
        if( err ) {
          debug( 'ERROR: Failed to get users. (err, userIds)' );
          debug( err, userIds );
          return done( err );
        }

        // no users found
        if( !users.length ) {
          debug( 'ERROR: No users found.' );
          return done( new Error( 'No users found.' ) );
        }

        // check for missing users and debug output for them
        userIds.forEach( function( userId ) {
          if( lodash.findIndex( users, { id: userId } ) === -1 ) {
            debug( 'WARN: User %d not found.', userId );
          }
        });

        // filter out users who elected to not get email
        users = users.filter( function( user ) {
          if( !user.sendNotifications ) {
            debug( 'WARN: Refusing to send email to user %d based on preferences.', user.id );
            return false;
          }

          return true;
        });

        // start to construct message options
        var msgOptions = {
          from: env.get( 'email_from' ),
          subject: meta.subject
        };

        // for each user send the email, and fire done callback once complete
        var errors = [];
        var infos = [];
        var sent = 0;
        var partDone = function() {
          if( sent === users.length ) {
            return done( errors, infos );
          }

          sent++;
        };

        users.forEach( function( user ) {
          // replace the to field
          msgOptions.to = {
            address: user.email
          };

          if( user.name ) {
            msgOptions.to.name = user.name;
          }

          // update text for this user as context
          msgOptions.text = nunjucks.render( message + '/message.txt', {
            user: user,
            meta: meta
          });

          // send email
          transport.sendMail( msgOptions, function( err, info ) {
            if( err ) {
              debug( 'ERROR: Failed to send email "%s" to "%s". (err)', meta.subject, user.email );
              debug( err );
              errors.push( err );
            }

            infos.push( info );
            partDone();
          });
        });
      });
    }
  };
};
