/* global App, DS */
/**
 * @file Defines the Topic model
 * @module app/models/task
 * @license https://www.mozilla.org/MPL/2.0/ MPL-2.0
 */

/**
 * Topic model for Ember app.
 *
 * @type {DS.Model}
 */
App.Topic = DS.Model.extend({
  name: DS.attr( 'string' ),
  description: DS.attr( 'string' ),
  createdAt: DS.attr( 'date' ),
  updatedAt: DS.attr( 'date' ),

  tasks: DS.hasMany( 'task', { async: true } ),
  user: DS.belongsTo( 'user', { async: true } )
});
