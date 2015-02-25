/**
 * @file configures and initializes the httpd, and sets up available routes
 * @module httpd
 *
 * @license https://www.mozilla.org/MPL/2.0/ MPL-2.0
 *
 * @requires models
 * @requires routes
 * @requires research
 */

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
var marked = require( 'marked' );
var moment = require( 'moment' );
var nunjucks = require( 'nunjucks' );
var debug = require( 'debug' );

/*
  setup environment
 */
if( process.env.NODE_ENV !== 'testing' ) {
  Habitat.load();
}
else {
  Habitat.load( __dirname + '/.env-test' );
}

/**
 * Environment manipulator.
 *
 * @type {Habitat}
 */
var env = new Habitat();
// drop package.json info into env
env.set( 'pkg', require( './package.json' ) );

// force init debug now we have the env loaded
debug.enable( env.get( 'debug' ) );
debug.useColors();

/*
  setup debuggers
 */
var debugEnv = debug( 'env' );
var debugPersona = debug( 'persona' );
debugEnv( 'debug enabled' );
debugEnv( 'pkg.version: %s, env: %s', env.get( 'pkg' ).version, env.get( 'node_env' ) );

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

if( env.get( 'force_ssl' ) ) {
  debugEnv( 'Attempting to force ssl connections' );
}
app.use( function( req, res, next ) {
  if( env.get( 'force_ssl' ) ) {
    if( req.headers[ 'x-forwarded-proto' ] && req.headers[ 'x-forwarded-proto' ] !== 'https' ) {
      res.redirect( 'https://' + req.hostname + req.originalUrl );

      return;
    }

    if( !req.secure && !req.headers[ 'x-forwarded-proto' ] ) {
      res.redirect( 'https://' + req.hostname + req.originalUrl );

      return;
    }
  }

  next();
});

// persona login
require( 'express-persona' )( app, {
  audience: env.get( 'persona_audience' )
});

debugPersona( env.get( 'persona_audience' ) );

if( process.env.NODE_ENV !== 'testing' ) {
  // enable csrf protection on all non-GET/HEAD/OPTIONS routes with the
  // excaption of persona verification/logout routes which have already
  // been set up.
  app.use( csrf() );
}

/*
  setup http debug output
 */
if( debug( 'http' ).enabled ) {
  debugEnv( 'using morgan for \033[0;37mhttp\033[0m debug notices' );
  app.use( morgan( '  \033[0;37mhttp\033[0m :method :url :status +:response-time ms - :res[content-length] bytes' ) );
}

/*
  setup nunjucks
 */

/**
 * Configured Nunjucks environment.
 * @type {Nunjucks.Environment}
 */
var nunjucksEnv = nunjucks.configure( 'views', {
  autoescape: true,
  watch: true
});

// add markdown support to nunjucks
nunjucksEnv.addFilter( 'markdown', function( str ) {
  return nunjucksEnv.getFilter( 'safe' )( marked( str ) );
});

// add basic moment support to nunjucks
nunjucksEnv.addFilter( 'moment', function( str, format ) {
  format = format || 'MMMM Do YYYY';
  return moment( str ).format( format );
});
nunjucksEnv.addFilter( 'calendar', function( str ) {
  return moment( str ).calendar();
});
nunjucksEnv.addFilter( 'relativeMoment', function( str ) {
  return moment( str ).from( moment() );
});

// make nunjucks the default view renderer
nunjucksEnv.express( app );

/*
  get models
 */
/**
 * Database ORM instance
 * @type {Object}
 */
var db = require( './models' )( env );

/*
  routes
 */
/**
 * Route handlers.
 * @type {Object}
 */
var routes = require( './routes' )( env );

// keep sessions up to date no matter what.
app.use( routes.auth.updateSession );

// add useful variables + objects `res.locals`, such as the csrf token,
// session email (set by persona), and any user details.
app.use( function( req, res, next ) {
  // disable csrf protection in test environment
  if( process.env.NODE_ENV !== 'testing' ) {
    res.locals.csrfToken = req.csrfToken();
  }

  res.locals.user = req.session.user;
  res.locals.persona = req.session.email;
  res.locals.cookies = req.cookies;

  next();
});

// setup any research
require( './libs/research' )( app, env );

// healthcheck
app.get( '/healthcheck', routes.healthcheck );

// public web routes (ex. API)
app.get( '/', routes.public.index );
app.get( '/help', routes.public.help );
app.get( '/help/topics', routes.help.topics);
app.get( '/help/tasks', routes.help.tasks);
app.get( '/help/topics', routes.help.account);

app.get( '/about', routes.public.about );
app.get( '/legal', routes.public.legal );

// user management
app.get( '/users', routes.auth.enforceAdmin, routes.users.users );
app.get( '/users/create', routes.users.create );
app.get( '/users/:id', routes.auth.enforce, routes.users.user );
app.get( '/users/:id/update', routes.auth.enforce, routes.users.update );

// topic management
app.get( '/topics', routes.auth.enforce, routes.topics.topics );
app.get( '/topics/create', routes.auth.enforce, routes.topics.create );
app.get( '/topics/:id', routes.auth.enforce, routes.topics.topic );
app.get( '/topics/:id/update', routes.auth.enforce, routes.topics.update );

// task management
app.get( '/tasks', routes.auth.enforce, routes.tasks.tasks );
app.get( '/tasks/create', routes.auth.enforce, routes.tasks.create );
app.get( '/tasks/:id', routes.auth.enforce, routes.tasks.task );
app.get( '/tasks/:id/update', routes.auth.enforce, routes.tasks.update );

// administration
app.all( '/admin*', routes.auth.enforceAdmin );

app.get( '/admin/email', routes.admin.email.get );
app.post( '/admin/email', routes.admin.email.post );

app.get( '/admin/users', routes.admin.users );

// create a new user (api)
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
      return console.error( error );
    }

    /**
     * HTTP Server
     * @return {http.server}
     */
    var server = app.listen( env.get( 'port' ) || 3000, function() {
      console.log( 'Now listening on port %d', server.address().port );
    });
  });
}
else {
  /**
   * Exported HTTP Server
   * @type {http.server}
   */
  module.exports = app.listen( env.get( 'port' ) );
}
