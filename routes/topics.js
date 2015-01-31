/**
 * @file Provides logic for loading Topic http routes.
 * @module routes/topics
 *
 * @license https://www.mozilla.org/MPL/2.0/ MPL-2.0
 */

/**
 * Topic route handlers.
 *
 * @example
 *
 *  // assuming you've loaded an environment into `env`
 *  var topicRoutes = require( './routes/topics' )( env );
 *
 *  app.get( '/topics/create', topicRoutes.create );
 *  app.get( '/topics/:id', topicRoutes.topic );
 *
 * @param  {Habitat} env An instance of a habitat environment manipulator.
 * @return {Object}      An object contaning all the HTTP route handlers for topics.
 */
module.exports = function( env ) {
  var db = require( '../models' )( env );
  var errorResponse = require( './errors' )( env );
  var debug = require( 'debug' )( 'routes:topics' );

  return {
    /**
     * Handle requests for a listing of ALL topics.
     *
     * **Note:** Will only load listing for topics belonging to the current user.
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse}  res
     */
    topics: function( req, res ) {
      debug( 'Get ALL topics for user %d', req.session.user.id );

      return db.Topic.findAll({
        where: {
          UserId: req.session.user.id
        },
        include: [ db.Task ]
      }).done( function( err, topics ) {
        if( err ) {
          debug( 'ERROR: Failed to get topics. (err, session)' );
          debug( err, req.session );

          return errorResponse.internal( req, res, err );
        }

        res.render( 'topics/topics.html', { topics: topics } );
      });
    },
    /**
     * Handle requests for a specific topic.
     *
     * **Note:** Will only load topics that belong to the current sessions user.
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse}  res
     */
    topic: function( req, res ) {
      debug( 'Get topic: %d', req.params.id );

      return db.Topic.find({
        where: {
          id: req.params.id
        },
        include: [ db.Task ]
      }).done( function( err, topic ) {
        if( err ) {
          debug( 'ERROR: Failed to get topic. (err, taskId)' );
          debug( err, req.params.id );

          return errorResponse.internal( req, res, err );
        }

        if( !topic ) {
          return errorResponse.notFound( req, res );
        }

        if( topic.UserId !== req.session.user.id ) {
          return errorResponse.forbidden( req, res );
        }

        res.render( 'topics/topic.html', JSON.parse( JSON.stringify( topic ) ) );
      });
    },
    /**
     * Handle requests topic creation form.
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse}  res
     */
    create: function( req, res ) {
      debug( 'Get topic creation form.' );

      res.render( 'topics/create.html' );
    }
  };
};
