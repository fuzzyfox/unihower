/**
 * @file Generates random data for use in tests.
 * @module tools/faker
 *
 * @example Generate users
 *  $ node tools/faker --model=user --num-items=20
 *
 * @example Generate topics
 *  $ node tools/faker --model=topic --num-items=27 --max-user-id=20
 *
 * @example Generate tasks
 *  $ node tools/faker --model=task --num-items=234 --max-user-id=20 --max-topic-id=27
 *
 * @license https://www.mozilla.org/MPL/2.0/ MPL-2.0
 *
 * @requires minimist
 * @requires faker
 */

/*
  require packages
 */
var faker = require( 'faker' );

// we need to know valid states from the db...
// this means we need to load the environment too :/
var Habitat = require( 'Habitat');
Habitat.load( __dirname + '/../.env-test' );
var env = new Habitat();
var taskModel = require( '../models' )( env ).Task; // used to get valid states for tasks

/**
 * Shortcut to random integer from range (inclusive).
 *
 * @param  {Number} min Minimum value.
 * @param  {Number} max Maximum value.
 * @return {Number}     Random interger within range.
 */
function randomIntegerBetween( min, max ) {
  return Math.floor( faker.random.number( { min: min, max: max } ) );
}

/**
 * Module Exports
 *
 * @type {Object}
 */
module.exports = {
  /**
   * Generates random user objects.
   *
   * @param  {Number}  [numItems]    Number of objects to generate. Default = 1
   * @param  {String}  [emailDomain] Domain for the email addresses to belong to. Defaults to random
   * @param  {Boolean} [setAdmin]    Sets the first user object as an administrator. Default = false
   * @return {Array}                 Array of generated objects.
   */
  user: function( numItems, emailDomain, setAdmin ) {
    numItems = numItems || 1;

    // store generated users in array for returning back
    var results = [];

    // declare a tmp store for name data
    var name = {};
    // generate data
    for( var i = 0; i < numItems; i++ ) {
      // generate a name
      name.first = faker.name.firstName();
      name.last = faker.name.lastName();

      // add random user to results
      results.push({
        name: name.first + ' ' + name.last,
        email: faker.internet.email( name.first, name.last, emailDomain ).toLowerCase(),
        sendNotifications: Math.floor( Math.random() * 2 )
      });
    }

    // make the first user of the results an admin
    if( setAdmin ) {
      results[ 0 ].isAdmin = true;
    }

    return results;
  },
  /**
   * Generates random topic objects.
   *
   * @param  {Number} [numItems]  Number of objects to generate. Default = 1
   * @param  {Number} [maxUserId] Maximum UserId to generate a topic for. Default = 1
   * @return {Array}              Array of generated objects.
   */
  topic: function( numItems, maxUserId ) {
    numItems = numItems || 1;
    maxUserId = maxUserId || 1;

    // store generated results for returning back
    var results = [];

    // declare some tmp stores for generation needs
    var genName = false;
    var genDescription = false;

    // generate data
    for( var i = 0; i < numItems; i++ ) {
      // randomly decide if we generate a topic name
      genName = Math.floor( Math.random() * 2 );
      // if we have no name we MUST generate a description, else randomly do/dont.
      genDescription = genName ? Math.floor( Math.random() * 2 ) : true;

      results.push({
        name: genName ? faker.company.companyName() : null,
        description: genDescription ? faker.lorem.sentences() : null,
        UserId: randomIntegerBetween( 1, maxUserId )
      });
    }

    return results;
  },
  /**
   * Generate random task objects.
   *
   * WARNING: This method does not attempt to match the UserId of a Topic.
   *
   * @param  {Number} [numItems]   Number of objects to generate. Default = 1
   * @param  {Number} [maxUserId]  Maximum UserId to generate objects for. Default = 1
   * @param  {Number} [maxTopicId] Maximum TopicId to generate objects for. Dafault = 0
   * @return {Array}               Array of generated objects.
   */
  task: function( numItems, maxUserId, maxTopicId ) {

    numItems = numItems || 1;
    maxUserId = maxUserId || 1;
    maxTopicId = maxTopicId || 0;

    // get valid states
    var states = taskModel.rawAttributes.state.values;

    // store generated results for returning back
    var results = [];

    // generate data
    for( var i = 0; i < numItems; i++ ) {
      results.push({
        description: faker.hacker.phrase(),
        state: states[ Math.floor( Math.random() * states.length ) ],
        coordX: randomIntegerBetween( -100, 100 ),
        coordY: randomIntegerBetween( -100, 100 ),
        TopicId: maxTopicId ? null : randomIntegerBetween( 1, maxTopicId ),
        UserId: randomIntegerBetween( 1, maxUserId )
      });
    }

    return results;
  }
};

/*
  deal with CLI usage
 */

if( require.main === module ) {
  var argv = require( 'minimist' )( process.argv.slice( 2 ) );

  // set defaults for cli options
  var args = {
    model: argv.m || argv.model || 'user',
    numItems: argv.n || argv[ 'num-items' ] || 5,
    noAdmin: argv[ 'no-admin' ] || false,
    emailDomain: argv.e || argv[ 'email-domain' ],
    maxUserId: argv.u || argv[ 'max-user-id' ] || 5,
    maxTopicId: argv.t || argv[ 'max-topic-id' ] || 5
  };

  var cliMap = {
    user: function() {
      return module.exports.user( args.numItems, args.emailDomain, !args.noAdmin );
    },
    topic: function() {
      return module.exports.topic( args.numItems, args.maxUserId );
    },
    task: function() {
      return module.exports.task( args.numItems, args.maxUserId, args.maxTopicId );
    }
  };

  console.log( JSON.stringify( cliMap[ args.model ](), null, 2 ) );
}
