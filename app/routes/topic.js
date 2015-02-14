/* global App, Ember */
/**
 * @file Handles routing for /topic/:topicId
 * @module app/route/topic
 * @license https://www.mozilla.org/MPL/2.0/ MPL-2.0
 */

/**
 * Topic Route
 *
 * @return {Ember.Route}
 */
App.TopicRoute = Ember.Route.extend({
  model: function( params ) {
    return this.store.find( 'topic', params.topicId );
  }
});
