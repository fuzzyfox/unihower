/* global App, Ember */
/**
 * @file Handles routing of application level items.
 * @module app/routes/application
 * @license https://www.mozilla.org/MPL/2.0/ MPL-2.0
 */

/**
 * Application Route.
 *
 * @return {Ember.Route}
 */
App.ApplicationRoute = Ember.Route.extend({
  actions: {
    error: function( error, transition ) {
      console.log( error );
      error.code = error.status || 500;

      if( error.responseJSON ) {
        Ember.$.extend( error, error.responseJSON );
      }
      else {
        error.status = error.statusText || 'Internal Application Error';
      }

      // hacky hack for handlebars not supporing conditionals.
      if( error.code === 401 ) {
        error.unauthorized = true;
      }

      return true;
    }
  }
});
