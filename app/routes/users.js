/* global App, Ember */
/**
 * @file Handles routing for /users
 * @module app/route/users
 * @license https://www.mozilla.org/MPL/2.0/ MPL-2.0
 */

/**
 * Users Route
 *
 * @return {Ember.Route}
 */
App.UsersRoute = Ember.Route.extend({
  model: function() {
    return this.store.find( 'user' );
  }
});
