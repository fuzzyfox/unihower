/*
  require packages
 */
var express = require( 'express' );
var morgan = require( 'morgan' );
var helmet = require( 'helmet' );
var Habitat = require( 'habitat' );

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

// server security
app.use( helmet.xframe( 'sameorigin' ) );
app.use( helmet.hsts() );
app.use( helmet.nosniff() );
app.use( helmet.xssFilter() );
app.disable( 'x-powered-by' );

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

/*
  setup db + launch server
 */
db.sequelize.sync( { force: env.get( 'db_force_sync' ) } ).complete( function( error ) {
  if( error ) {
    return console.log( error );
  }

  var server = app.listen( env.get( 'port' ) || 3000, function() {
    console.log( 'Now listening on port %d', server.address().port );
  });
});
