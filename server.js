/*
  require packages
 */
var express = require( 'express' );
var morgan = require( 'morgan' );
var helmet = require( 'helmet' );
var Habitat = require( 'habitat' );
var bodyParser = require( 'body-parser' );
var cookieParser = require( 'cookie-parser' );
var session = require( 'express-session' );

/*
  setup environment
 */
if( process.env.NODE_ENV !== 'testing' ) {
  Habitat.load();
}
else {
  Habitat.load( __dirname + '/.env-test' );
}
var env = new Habitat();
// drop package.json info into env
env.set( 'pkg', require( './package.json' ) );

/*
  setup server
 */
var app = express();
// static, public dir
app.use( express.static( __dirname + '/public' ) );
// work nicely with cookies
app.use( cookieParser() );
app.use( bodyParser.json() );
app.use( bodyParser.urlencoded( { extended: true } ) );
app.use( session({
  secret: env.get( 'session_secret' ),
  resave: env.get( 'session_resave' ) || false,
  saveUninitialized: env.get( 'session_save_uninitialized' ) || false
}) );

// server security
app.use( helmet.xframe( 'sameorigin' ) );
app.use( helmet.hsts() );
app.use( helmet.nosniff() );
app.use( helmet.xssFilter() );
app.disable( 'x-powered-by' );

// persona login
require( 'express-persona' )( app, {
  audience: env.get( 'persona_audience' )
});

/*
  setup debug output
 */
if( env.get( 'debug' ).match( /http/i ) ) {
  app.use( morgan( 'dev' ) );
}

/*
  get models
 */
var db = require( './models' )( env );

/*
  routes
 */
var routes = require( './routes' )( env );

// healthcheck
app.get( '/healthcheck', routes.healthcheck );

app.get( '/', function( req, res ) {
  res.send( 'It worked!' );
});

// create new user
app.post( '/api/users', routes.api.users.create );

/*
  authenticated routes (any user)
 */

// enforce valid user for all routes now on
app.all( '/api*', routes.auth.enforce );

// api for specific user
app.get( '/api/users/:id', routes.api.users.get );
app.put( '/api/users/:id', routes.api.users.update );
app.delete( '/api/users/:id', routes.api.users.delete );

/*
  authenticated routes (administrators)
 */
app.all( '/api*', routes.auth.enforceAdmin );

// api get list of all users
app.get( '/api/users', routes.api.users.list );

/*
  setup db + launch server
 */
if( process.env.NODE_ENV !== 'testing' ) {
  db.sequelize.sync( { force: env.get( 'db_force_sync' ) } ).complete( function( error ) {
    if( error ) {
      return console.log( error );
    }

    var server = app.listen( env.get( 'port' ) || 3000, function() {
      console.log( 'Now listening on port %d', server.address().port );
    });
  });
}
else {
  module.exports = app.listen( env.get( 'port' ) );
}
