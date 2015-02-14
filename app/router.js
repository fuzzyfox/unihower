/* global App */
/**
 * @file Declares and defines routing within the Ember application.
 * @module app/router
 * @license https://www.mozilla.org/MPL/2.0/ MPL-2.0
 */

App.Router.map( function() {
  this.resource( 'users', function() {
    this.resource( 'user', { path: '/:userId' }, function() {
      this.route( 'edit' );
      this.route( 'delete' );
    });

    this.route( 'create' );
  });

  this.resource( 'topics', function() {
    this.resource( 'topic', { path: '/:topicId' }, function() {
      this.route( 'edit' );
      this.route( 'delete' );
    });

    this.route( 'create' );
  });

  this.resource( 'tasks', function() {
    this.resource( 'task', { path: '/:taskId' }, function() {
      this.route( 'edit' );
      this.route( 'delete' );
    });

    this.route( 'create' );
  });

  this.route( 'notFound', { path: '/*path' } );
});
