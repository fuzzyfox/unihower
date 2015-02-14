/* global App, DS, Ember */
/**
 * @file configures the application's link to the REST api on the server.
 * @module app/store
 * @license https://www.mozilla.org/MPL/2.0/ MPL-2.0
 */

/**
 * Application data backhaul adapter.
 *
 * @type {DS.Adapter}
 */
App.ApplicationAdapter = DS.RESTAdapter.extend({
  namespace: 'api',

  ajaxError: function( jqXHR ) {
    var error = this._super( jqXHR );

    if( jqXHR && ( jqXHR.status === 422 || jqXHR.status === 409 ) ) {
      var jsonErrors = Ember.$.parseJSON( jqXHR.responseText );

      return new DS.InvalidError( jsonErrors );
    }
    else {
      return error;
    }
  }
});
