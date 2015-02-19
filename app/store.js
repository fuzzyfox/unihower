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

  /**
   * Enable error handling based on REST API responses.
   *
   * @see {@link http://emberjs.com/api/data/classes/DS.InvalidError.html}
   *
   * @param  {jqXHR} jqXHR jQuery XMLHTTPRequest object
   * @return {Mixed}       Either an Ember Data DS.InvalidError when response 422/409 else Ember.Error
   */
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

/**
 * Application data store (local cache).
 *
 * @type {DS.Store}
 */
// App.store.reopen({
//   *
//    * Clear all cached data in the store.
//    *
//    * @see {@link https://stackoverflow.com/a/26409785}

//   clear: function() {
//     for( var key in this.typeMaps ) {
//       this.unloadAll( this.typeMaps[ key ].type );
//     }
//   }
// });
