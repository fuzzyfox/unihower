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
  // ORM
  var db = require( '../models' )( env );
  // lodash
  var lodash = require( 'lodash' );
  // nunjucks
  var nunjucks = require( 'nunjucks' );

  /*
    setup nunjucks environment for email
   */
  var nunjucksEnv = nunjucks.configure( 'emailTemplates', {
    autoescape: true,
    watch: true
  });
  // add website var to nunjucks
  nunjucksEnv.addGlobal( 'website', env.get( 'persona_audience' ).replace( /:\d+$/i, '' ) );

  /*
    setup transport based on config
   */
  var transport;
  switch( env.get( 'email_transport' ) ) {
    case 'smtp':
      var smtpTransport = require( 'nodemailer-smtp-transport' )({
        port: env.get( 'email_port' ),
        host: env.get( 'email_host' ),
        secure: env.get( 'email_secure' ),
        authMethod: env.get( 'email_auth_method' ),
        ignoreTLS: env.get( 'email_ignore_tls' ),
        auth: {
          user: env.get( 'email_auth_user' ),
          pass: env.get( 'email_auth_pass' )
        },
        tls: {
          ciphers:'SSLv3'
        }
      });
      transport = nodemailer.createTransport( smtpTransport );
    break;
    case 'direct':
      transport = nodemailer.createTransport();
    break;
    default:
      transport = nodemailer.createTransport();
  }

  return {
    /**
     * Send email to a single user based on their ID
     *
     * Will send the given message to the email address of the user (from the db)
     * and provide user data as a nunjucks context for the message.
     *
     * Email will only be sent if the user has `sendNotifications` set to TRUE.
     *
     * The meta param MUST include at least a subject.
     *
     * @example
     *   // send email to first user in db
     *   var email = require( './lib/email' );
     *   email.sendRaw( 1, { subject: 'Awesome Subject' }, 'This is an awesome email to {{ user.name }}' );
     *
     * @param  {Number}   userId  User ID
     * @param  {Object}   meta    Metadata for the message.
     * @param  {String}   message The message to send to the user.
     * @param  {Function} done    Nodemailer transport.sendMail callback
     */
    sendRaw: function( userId, meta, message, done ) {
      done = done || function() {};

      db.User.find( userId ).done( function( err, user ) {
        // database error
        if( err ) {
          debug( 'ERROR: Failed to get user. (err, userId)' );
          debug( err, userId );
          return done( err );
        }

        // user not found
        if( !user ) {
          debug( 'ERROR: User %d not found.', userId );
          return done( new Error( 'User not found' ) );
        }

        // user requested no emails
        if( !user.sendNotifications ) {
          debug( 'WARN: Refusing to send email based on user %d\'s preferences.', userId );
          return done( new Error( 'User not accepting email.' ) );
        }

        // construct message options
        var msgOptions = {
          // email going to user.email
          to: {
            address: user.email
          },
          from: meta.from || env.get( 'email_from' ),
          subject: meta.subject
        };

        if( user.name ) {
          // if user has a name add that in too
          msgOptions.to.name = user.name;
        }

        // render message with user data as context
        msgOptions.text = nunjucks.renderString( message, {
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
     * Send email to a user based on ID using a predefined template
     *
     * Will send the given predefined message to the email address of the user
     * (from the db) and provide user data as a nunjucks context for the message.
     *
     * Email will only be sent if the user has `sendNotifications` set to TRUE.
     *
     * @param  {Number}   userId          ID of user to send to
     * @param  {String}   messageTemplate The message template to send (must be defined in ../emailTemplates)
     * @param  {Function} [done]          Nodemailer transport.sendMail callback
     */
    send: function( userId, messageTemplate, done ) {
      var meta = {};

      // get message metadata
      try {
        meta = require( '../emailTemplates/' + messageTemplate );
      }
      catch( err ) {
        debug( 'ERROR: Failed to load message metadata for template "%s". (err)', messageTemplate );
        return debug( err );
      }

      // get message content and pass it on to this.sendRaw
      try {
        var message = nunjucksEnv.getTemplate( messageTemplate + '/message.txt' ).tmplStr;

        return this.sendRaw( userId, meta, message, done );
      }
      catch( err ) {
        debug( 'ERROR: Failed to load message content from template "%s". (err)', messageTemplate );
        return debug( err );
      }
    },
    /**
     * Bulk send an email to specifed users by ID
     *
     * Will send the given message to the email address of the users (from the db)
     * and provide user data as a nunjucks context for each message.
     *
     * Email will only be sent if the users where `sendNotifications` set to TRUE.
     *
     * The meta param MUST include at least a subject.
     *
     * @example
     *   // send email to first user in db
     *   var email = require( './lib/email' );
     *   email.sendBulkRaw( [ 1, 4, 6 ], { subject: 'Awesome Subject' }, 'This is an awesome email to {{ user.name }}' );
     *
     * @param  {Array}    userIds An array of user IDs to send emails to.
     * @param  {Object}   meta    Metadata for the message that is being sent.
     * @param  {String}   message The message to be sent
     * @param  {Function} [done]  nodemailer transport.sendMail callback
     */
    sendBulkRaw: function( userIds, meta, message, done ) {
      done = done || function() {};

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
          if( lodash.findIndex( users, { dataValues: { id: userId } } ) === -1 ) {
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

        // check if we're going to be sending any messages
        if( !users.length ) {
          debug( 'WARN: No messages will be sent due to user perfs.' );
          return done();
        }

        // start to construct message options
        var msgOptions = {
          from: meta.from || env.get( 'email_from' ),
          subject: meta.subject
        };

        // for each user send the email, and fire done callback once complete
        var errors = [];
        var infos = [];
        var sent = 0;
        var partDone = function() {
          sent++;
          if( sent === users.length ) {
            return done( errors, infos );
          }
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
          msgOptions.text = nunjucks.renderString( message, {
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
    },
    /**
     * Bulk send an email to specified users using a predefined template.
     *
     * Will send the given message to the email addresses of the users (from the db)
     * and provide user data as a nunjucks context for the message per user.
     *
     * Emails will only be sent to users with `sendNotifications` set to TRUE.
     *
     * @param  {Array}    userIds         An array of user IDs
     * @param  {String}   messageTemplate The message to send (must be defined in ../emailTemplates)
     * @param  {Function} [done]          nodemailer transport.sendMail callback
     */
    sendBulk: function( userIds, messageTemplate, done ) {
      var meta = {};

      // get message metadata
      try {
        meta = require( '../emailTemplates/' + messageTemplate );
      }
      catch( err ) {
        debug( 'ERROR: Failed to load message metadata for template "%s". (err)', messageTemplate );
        return debug( err );
      }

      // get message content and pass it on to this.sendRaw
      try {
        var message = nunjucksEnv.getTemplate( messageTemplate + '/message.txt' ).tmplStr;

        return this.sendBulkRaw( userIds, meta, message, done );
      }
      catch( err ) {
        debug( 'ERROR: Failed to load message content from template "%s". (err)', messageTemplate );
        return debug( err );
      }
    }
  };
};
