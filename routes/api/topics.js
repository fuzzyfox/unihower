/**
 * @file Provides handlers for topic api routes.
 * @module routes/api/topics
 *
 * @license https://www.mozilla.org/MPL/2.0/ MPL-2.0
 *
 * @requires models
 * @requires routes/errors
 */

/**
 * Topic API exports
 *
 * @example
 *
 *  // assuming you've loaded an environment into `env`
 *  var topicApiRoutes = require( './routes/api/topics' )( env );
 *
 *  // uses the `create` method to handle the request.
 *  app.post( '/api/topics', topicApiRoutes.create );
 *
 * @param  {Habitat} env An instance of a habitat environment manipulator.
 * @return {Object}      An object containing all user api route handlers.
 */
module.exports = function( env ) {
  var db = require( '../../models' )( env );
  var errorResponse = require( '../errors' )( env );
  var debug = require( 'debug' )( 'api:topics' );

  return {
    /**
     * Create a new topic.
     *
     * Once a topic is created it is automatically associated to the user that
     * created it.
     *
     * **Note:** `req.body` must be an object containing the data for the new topic.
     *
     * *Method intended for HTTP POST requests.*
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse}  res
     */
    create: function( req, res ) {
      debug( 'Create topic: %s', req.body.name );

      // find active user in db
      return db.User.find( req.session.user.id ).done( function( err, user ) {
        // database error finding user
        if( err ) {
          debug( 'ERROR: Failed ot get user to associate to. (err, body, session)' );
          debug( err, req.body, req.session );

          return errorResponse.internal( req, res, err );
        }

        // only way there will be no user at this stage is if the user has just
        // been removed while the create topic request was being made
        //
        // user is forbidden from performing action now
        if( !user ) {
          return errorResponse.forbidden( req, res );
        }

        // build topic from given data, then add to the user
        user.addTopic( db.Topic.build( req.body ) ).done( function( err, topic ) {
          // database error creating topic
          if( err ) {
            debug( 'ERROR: Failed to create topic. (err, body)' );
            debug( err, req.body );

            return errorResponse.internal( req, res, err );
          }

          res.status( 200 ).json( topic );
        });
      });
    },
    /**
     * Get a specific topics details.
     *
     * Only the user who's details are being requested, can retrieve the topic details.
     *
     * **Note:** `req.params.id` must be the id for the topic to fetch.
     *
     * *Method intended for HTTP GET requests.*
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse}  res
     */
    get: function( req, res ) {
      debug( 'Get topic: %d', req.params.id );

      // find topic in database
      return db.Topic.find( req.params.id ).done( function( err, topic ) {
        // database error finding topic
        if( err ) {
          debug( 'ERROR: Failed to find topic. (err, topicId)' );
          debug( err, req.params.id );

          return errorResponse.internal( req, res, err );
        }

        // topic not found
        if( !topic ) {
          return errorResponse.notFound( req, res );
        }

        // topic does not belong to user
        if( topic.UserId !== req.session.user.id ) {
          return errorResponse.forbidden( req, res );
        }

        // return topic
        res.status( 200 ).json( topic );
      });
    },
    /**
     * Returns a 403 forbidden instead of all topic listing.
     *
     * This function is here as a placeholder for consistency in the API. No
     * user should be able to access anothers topic details.
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse}  res
     */
    list: function( req, res ) {
      return errorResponse.forbidden( req, res );
    },
    /**
     * Update a specific topics details.
     *
     * Only the user who's details are being updated can modify details.
     *
     * **Note:** `req.body` must be an object containing the data for the new topic, and
     * `req.params.id` must be the id for the topic to update.
     *
     * *Method intended for HTTP PUT/POST requests.*
     *
     * @todo prevent users changing topic ownership
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse}  res
     */
    update: function( req, res ) {
      debug( 'Update topic: %d', req.params.id );

      // find topic in database
      return db.Topic.find( req.params.id ).done( function( err, topic ) {
        // database error finding topic
        if( err ) {
          debug( 'ERROR: Failed to find topic. (err, params, session)' );
          debug( err, req.params, req.session );

          return errorResponse.internal( req, res, err );
        }

        // topic not found
        if( !topic ) {
          return errorResponse.notFound( req, res );
        }

        // topic does not belong to user
        if( topic.UserId !== req.session.user.id ) {
          return errorResponse.forbidden( req, res, err );
        }

        // update topic
        topic.updateAttributes( req.body ).done( function( err, topic ) {
          // database error updating topic
          if( err ) {
            debug( 'ERROR: Failed to update topic. (err, body)' );
            debug( err, req.body );

            return errorResponse.internal( req, res, err );
          }

          res.status( 200 ).json( topic );
        });
      });
    },
    /**
     * Delete a specific topic.
     *
     * Only the user who's topic details will be removed, may remove the specified topic.
     *
     * **Note:** `req.params.id` must be the id for the topic to delete.
     *
     * *Method intended for HTTP DELETE requests.*
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse}  res
     */
    delete: function( req, res ) {
      debug( 'Destroy topic: %d', req.params.id );

      // find topic in database
      return db.Topic.find( req.params.id ).done( function( err, topic ) {
        // database error finding topic
        if( err ) {
          debug( 'ERROR: Failed to find topic. (err, topicId)' );
          debug( err, req.params.id );

          return errorResponse.internal( req, res, err );
        }

        // topic not found
        if( !topic ) {
          return errorResponse.notFound( req, res );
        }

        // topic does not belong to user
        if( topic.UserId !== req.session.user.id ) {
          return errorResponse.forbidden( req, res );
        }

        // delete topic from database
        topic.destroy().done( function( err ) {
          // database error while deleting
          if( err ) {
            debug( 'ERROR: Failed to destroy topic. (err, topicId)' );
            debug( err, req.params.id );

            return errorResponse.internal( req, res, err );
          }

          res.status( 204 ).end();
        });
      });
    },
    /**
     * Lists all the tasks that belong to a specific topic.
     *
     * **Note:** a user may only view their own tasks
     * **Note:** `req.params.id` must be the id for the topic to get tasks for.
     *
     * *Method intended for HTTP GET requests.*
     *
     * @param  {http.IncomingMessage} req
     * @param  {http.ServerResponse}  res
     */
    tasks: function( req, res ) {
      debug( 'Get topic %d\'s associated tasks.', req.params.id );

      // find topic
      return db.Topic.find({
        where: {
          id: req.params.id
        },
        include: [ db.Task ]
      }).done( function( err, topic ) {
        // database error finding topic w/ tasks
        if( err ) {
          debug( 'ERROR: Failed to find topic\'s tasks. (err, topicId)' );
          debug( err, req.params.id );

          return errorResponse.internal( req, res, err );
        }

        // topic not found
        if( !topic ) {
          return errorResponse.notFound( req, res );
        }

        // topic does not belong to user
        if( topic.UserId !== req.session.user.id ) {
          return errorResponse.forbidden( req, res );
        }

        // respond w/ results
        res.status( 200 ).json( topic.Tasks );
      });
    }
  };
};
