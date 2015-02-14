/* global App, DS */
/**
 * @file Defines the User model
 * @module app/model/user
 * @license https://www.mozilla.org/MPL/2.0/ MPL-2.0
 */

/**
 * User model for Ember app.
 *
 * @type {DS.Model}
 */
App.User = DS.Model.extend({
  name: DS.attr( 'string' ),
  email: DS.attr( 'string' ),
  emailHash: DS.attr( 'string' ),
  isAdmin: DS.attr( 'boolean' ),
  sendNotifications: DS.attr( 'boolean' ),
  researchParticipant: DS.attr( 'boolean' ),
  lastLogin: DS.attr( 'date' ),
  createdAt: DS.attr( 'date' ),
  updatedAt: DS.attr( 'date' ),

  gravatar: function() {
    return '//secure.gravatar.com/avatar/' + this.get( 'emailHash' ) + '?s=500';
  }.property( 'emailHash' ),

  topics: DS.hasMany( 'topic', { async: true } )
});
