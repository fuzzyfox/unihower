/* global App, Ember */
/**
 * Session Plugin
 *
 * Creates App.Session and handles its basic operations.
 */
Ember.Application.initializer({
  name: 'session',

  initialize: function( container, application ) {
    /**
     * Session Object
     *
     * @return {Ember.Object}
     */
    App.Session = Ember.Object.extend({
      /**
       * Initialize the session.
       *
       * Sets the access token and authorised account id from session storage.
       */
      init: function() {
        this._super();
        this.set( 'accessToken', window.sessionStorage.getItem( 'accessToken' ) );
        this.set( 'authAccountId', window.sessionStorage.getItem( 'authAccountId' ) );
      },

      /**
       * Update the stored accessToken on data binding
       */
      accessTokenChanged: function() {
        window.sessionStorage.setItem( 'accessToken', this.get( 'accessToken' ) );
      }.observes( 'accessToken' ),

      /**
       * Update the stored authAccountId on data binding
       */
      authAccountIdChanged: function() {
        var authAccountId = this.get( 'authAccountId' );

        window.sessionStorage.setItem( 'authAccountId', authAccountId );

        // attach current user data to local session
        if( !Ember.isEmpty( authAccountId ) ) {
          this.set( 'authAccount', App.User.find( authAccountId ) );
        }
      }.observes( 'authAccountId' ),

      reset: function( transition, newSession ) {
        if( typeof transition !== 'string' ) {
          newSession = transition;
          transition = 'index';
        }

        App.__container__.lookup( 'route:application' ).transitionTo( transition ); // jshint ignore:line
        Ember.run.sync();
        Ember.run.next( this, function() {
          this.setProperties( Ember.$.extend( {
            accessToken: null,
            authAccountId: null
          }, newSession ) );

        });
      }
    }).create();
  }
});

/**
 * Prefilters ALL ajax requests to the server so as to add any accessToken we
 * have set in App.Session
 */
Ember.$.ajaxPrefilter( function( options, originalOptions, jqXHR ) {
  if( !jqXHR.crossDomain ) {
    jqXHR.setRequestHeader( 'X-Access-Token', App.Session.get( 'accessToken' ) );
  }
});
