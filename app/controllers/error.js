/* global App, Ember */
/**
 * @file Define the error controller
 * @module  app/controllers/error
 * @license https://www.mozilla.org/MPL/2.0/ MPL-2.0
 */

/**
 * Error Controller
 *
 * @type {Ember.ObjectController}
 */
App.ErrorController = Ember.ObjectController.extend({
  needs: [ 'application' ],
  model: {
    code: 500,
    status: 'Application Error'
  }
});
