/* global App, Ember */
/**
 * @file defines the 404 route handler.
 * @module app/routes/notfound
 * @license https://www.mozilla.org/MPL/2.0/ MPL-2.0
 */

/**
 * Fallback 404 route handler.
 *
 * @return {Ember.Route}
 */
App.NotFoundRoute = Ember.Route.extend({
  renderTemplate: function() {
    var path = window.location.href.replace( /^\w+:\/\//i, '' ).replace( window.location.hostname, '' );
    var context = {
      code: 404,
      status: 'Not Found',
      message: path + ' was not found'
    };

    this.render( 'error', {
      into: 'application',
      model: context
    });
  }
});
