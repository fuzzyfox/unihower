/* global App, Ember */
/**
 * @file Handles routing for /topic/:topicId
 * @module app/routes/topic
 * @license https://www.mozilla.org/MPL/2.0/ MPL-2.0
 */

/**
 * Topic Route
 *
 * @return {Ember.Route}
 */
App.TopicsRoute = Ember.Route.extend({
  model: function() {
    return this.store.find( 'topic' );
  }
});
