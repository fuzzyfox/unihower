/**
 * @file Generates random data for use in tests.
 *
 * @example Generate users
 *  $ node tools/faker --model=user --num-items=20
 * @example Generate topics
 *  $ node tools/faker --model=topic --num-items=27 --max-user-id=20
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
var argv = require( 'minimist' )( process.argv.slice( 2 ) );
var faker = require( 'faker' );

/*
  configurables
 */
var opts = {
  model: argv.m || argv.model || 'user',
  numItems: argv.n || argv[ 'num-items' ] || 5,
  maxUserId: argv.u || argv[ 'max-user-id' ] || 5,
  maxTopicId: argv.t || argv[ 'max-topic-id' ] || 5
};

/*
  possible fake model data
 */
var models = {
  user: function() {
    var results = [];
    var fakeName;

    for( var i = 0; i < opts.numItems; i++ ) {
      fakeName = faker.name.findName();

      results.push({
        name: fakeName,
        email: faker.internet.email( fakeName.split( ' ' )[ 0 ], fakeName.split[ 1 ], 'restmail.net' ).toLowerCase(),
        isAdmin: false,
        sendNotifications: Math.floor( Math.random() * 2 )
      });
    }

    results[ 0 ].isAdmin = true;

    return results;
  },
  topic: function() {
    var results = [];

    for( var i = 0; i < opts.numItems; i++ ) {
      results.push({
        name: Math.floor( Math.random() * 2 ) ? null : faker.company.companyName(),
        description: faker.lorem.sentences(),
        UserId: Math.floor( faker.random.number( { min: 1, max: opts.maxUserId } ) )
      });
    }

    return results;
  },
  task: function() {
    var results = [];
    var states = [ 'incomplete', 'complete' ];

    for( var i = 0; i < opts.numItems; i++ ) {
      results.push({
        description: faker.hacker.phrase(),
        state: states[ Math.floor( Math.random() * states.length ) ],
        coordX: Math.floor( faker.random.number( { min: -100, max: 100 } ) ),
        coordY: Math.floor( faker.random.number( { min: -100, max: 100 } ) ),
        TopicId: Math.floor( faker.random.number( { min: 1, max: opts.maxTopicId } ) ),
        UserId: Math.floor( faker.random.number( { min: 1, max: opts.maxUserId } ) )
      });
    }

    return results;
  }
};

/*
  output results
 */
var result = models[ opts.model ]();
console.log( JSON.stringify( result, null, 2 ) );
