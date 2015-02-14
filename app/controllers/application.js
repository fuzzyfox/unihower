/* global App, Ember, jQuery */
/**
 * @file Defines the application level controller
 * @module  app/controllers/application
 * @license https://www.mozilla.org/MPL/2.0/ MPL-2.0
 */

/**
 * Application Controller
 *
 * @type {Ember.ObjectController}
 */
App.ApplicationController = Ember.ObjectController.extend({
  init: function() {
    this._super();

    window.navigator.id.watch({
      loggedInUser: App.Session.get( 'accessToken' ),
      onlogin: function( assertion ) {
        if( !App.Session.get( 'accessToken' ) ) {
          jQuery.ajax({
            type: 'POST',
            url: '/persona/verify',
            data: { assertion: assertion }
          }).done( function( data ) {
            App.Session.reset({
              accessToken: data.accessToken.token,
              authAccountId: data.user.id
            });
          }).fail( function() {
            window.navigator.id.logout();
          });
        }
      },
      onlogout: function() {
        jQuery.ajax({
          type: 'POST',
          url: '/persona/logout'
        }).done( function() {
          App.Session.reset();
        }).fail( function( xhr, status, err ) {
          window.alert( 'Logout failure: ' + err );
        });
      }
    });
  },

  actions: {
    login: function() {
      App.Session.set( 'accessToken', '' );
      window.navigator.id.request();
    },
    logout: function() {
      window.navigator.id.logout();
    }
  }
});
