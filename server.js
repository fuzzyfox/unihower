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
var csrf = require( 'csurf' );
var nunjucks = require( 'nunjucks' );

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

// pretty print JSON ouput in development environments
if( env.get( 'node_env' ) !== 'production' ) {
  app.set( 'json spaces', 2 );
}

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

if( process.env.NODE_ENV !== 'testing' ) {
  // enable csrf protection on all non-GET/HEAD/OPTIONS routes
  // with the excaption of persona verification/logout routes.
  app.use( csrf() );
}

// add csrf token to `res.locals`
app.use( function( req, res, next ) {
  // disable csrf protection in test environment
  if( process.env.NODE_ENV !== 'testing' ) {
    res.locals.csrfToken = req.csrfToken();
  }

  res.locals.user = req.session.user;
  res.locals.persona = req.session.email;

  next();
});

/*
  setup nunjucks
 */
// configure nunjucks
var nunjucksEnv = nunjucks.configure( 'views', {
  autoescape: true,
  watch: true
});

// make nunjucks the default view renderer
nunjucksEnv.express( app );

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

// create a new user
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

// api for specific users topics
app.get( '/api/users/:id/topics', routes.api.users.topics );

// api for specific topic
app.get( '/api/topics', routes.api.topics.list );
app.post( '/api/topics', routes.api.topics.create );
app.get( '/api/topics/:id', routes.api.topics.get );
app.put( '/api/topics/:id', routes.api.topics.update );
app.delete( '/api/topics/:id', routes.api.topics.delete );

// api for specific users tasks
app.get( '/api/users/:id/tasks', routes.api.users.tasks );
// api for specific topics tasks
app.get( '/api/topics/:id/tasks', routes.api.topics.tasks );

// api for specific task
app.get( '/api/tasks', routes.api.tasks.list );
app.post( '/api/tasks', routes.api.tasks.create );
app.get( '/api/tasks/:id', routes.api.tasks.get );
app.put( '/api/tasks/:id', routes.api.tasks.update );
app.delete( '/api/tasks/:id', routes.api.tasks.delete );

/*
  authenticated routes (administrators)
 */
app.all( '/api*', routes.auth.enforceAdmin );

// api get list of all users
app.get( '/api/users', routes.api.users.list );

/*
  handle 404 errors
 */
app.use( function( req, res ) {
  routes.errors.notFound( req, res );
});

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
