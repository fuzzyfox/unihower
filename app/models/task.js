/* global App, DS */
/**
 * @file Defines the Task model
 * @module app/models/task
 * @license https://www.mozilla.org/MPL/2.0/ MPL-2.0
 */

/**
 * Task model for Ember app.
 *
 * @type {DS.Model}
 */
App.Task = DS.Model.extend({
  description: DS.attr( 'string' ),
  dueDate: DS.attr( 'date' ),
  state: DS.attr( 'string' ),
  coordX: DS.attr( 'number' ),
  coordY: DS.attr( 'number' ),
  createdAt: DS.attr( 'date' ),
  updatedAt: DS.attr( 'date' ),

  topic: DS.belongsTo( 'topic', { async: true } )
});
