/**
 * @file Contains all the logic for sending emails to users from generating emails
 * from templates, to actually sending the emails.
 * @module lib/email
 *
 * @license https://www.mozilla.org/MPL/2.0/ MPL-2.0
 */

// var nodemailer = require( 'nodemailer' );
// var debug = require( 'debug' )( 'email' );

/**
 * Email library exports
 *
 * @param  {Habitat} env An instance of a habitat environment manipulator.
 * @return {Object}      An object containing all the HTTP error handlers.
 */
module.exports = function( env ) {
  return {
    send: function( messageOptions, done ) {},
    render: function( template, context, done ) {},
    bulkSend: function( recipients, messageOptions, done ) {}
  };
};
