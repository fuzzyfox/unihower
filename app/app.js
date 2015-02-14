/* global Ember */
/**
 * @file Declare the Ember application
 * @module app
 * @license https://www.mozilla.org/MPL/2.0/ MPL-2.0
 */

/**
 * Ember Application.
 *
 * @type {Ember.Application}
 */
window.App = Ember.Application.create({
  LOG_TRANSITIONS: true,
  LOG_TRANSITIONS_INTERNAL: true,
  LOG_VIEW_LOOKUPS: true,
  LOG_ACTIVE_GENERATION: true,
  LOG_BINDINGS: true
});
