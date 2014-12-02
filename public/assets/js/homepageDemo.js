/* global SVG */

( function( SVG ) {
  /*
    init w/ blank svg
   */
  var draw = new SVG( 'demoGraph' ).attr( {
    viewBox: '0 0 500 500',
    x: '0px',
    y: '0px',
    width: 500,
    height: 500,
    class: 'img-responsive'
  } );

  /**
   * Generate a random pastel colour
   * @return {String} CSS style hex colour value
   */
  function randColor() {
    var getVal = function() {
      return ( Math.round( Math.random() * 110 ) + 110 ).toString( 16 );
    };

    var r = getVal();
    var g = getVal();
    var b = getVal();

    return '#' + r + g + b;
  }

  /*
    draw axes
   */
  // create group for axes
  var axes = draw.group();

  // draw + add x-axis
  axes.add( draw.line( 20, 250, 480, 250 ).stroke( { width: 1, color: '#444' } ) );
  axes.add( draw.line( 250, 20, 250, 480 ).stroke( { width: 1, color: '#444' } ) );

  // draw arrow head // u = 4
  axes.add( draw.path( 'M 250 20 C 254 28, 258 30, 252 32 L 250 31, 248 32 C 242 30, 246 28, 250 20 Z' ).style( { fill: '#444', stroke: '#444' } ) );
  axes.add( draw.path( 'M 480 250 C 472 254, 470 258, 468 252 L 469 250, 468 248 C 470 242, 472 246, 480 250 Z' ).style( { fill: '#444', stroke: '#444' } ) );

  // tasks array.
  var tasks = [];

  // prevent adding new tasks to graph
  var preventAdd = false;

  // add a single task
  function addTask( x, y ) {
    if( !preventAdd ) {
      var task = draw.group();

      // add base circle to task
      task.add( draw.circle( 30 ).fill( randColor() ) );

      // add icon
      task.add( draw.text( '×' ).fill( '#ffffff' ) );
      task.last().center( task.first().attr( 'cx' ), task.first().attr( 'cy' ) );

      // center on given coordinates
      task.center( x, y );

      // add task class
      task.addClass( 'task' );

      // add task to tasks array.
      tasks.push( task );

      // handle events
      task.on( 'mouseenter', function() {
        preventAdd = true;
      });
      task.on( 'mouseout', function() {
        preventAdd = false;
      });
    }
  }

  draw.on( 'click', function( event ) {
    // prevent adding task over task (needs work)
    if( !preventAdd ) {
      // ratio between viewbox size, and parent element size
      var viewboxRatio = ( draw.viewbox().width / draw.parent.offsetWidth );
      // calc x,y coords for position of click in relation to origin of viewbox
      var loc = {
        x: ( event.layerX - draw.parent.offsetLeft ) * viewboxRatio,
        y: ( event.layerY - draw.parent.offsetTop ) * viewboxRatio
      };

      addTask( loc.x, loc.y );

      // randomly remove task from graph randomly
      if( Math.floor( Math.random() * 2 ) ) {
        var randomTask = tasks.splice( Math.floor( Math.random() * tasks.length ), 1 )[ 0 ];
        randomTask.remove();
      }
    }
  });

  // add some random tasks to get started using an async delayed loop
  (function step( i ) {
    if( i < 14 ) {
      var loc = {
        x: Math.floor( Math.random() * 450 ) + 25,
        y: Math.floor( Math.random() * 450 ) + 25
      };

      addTask( loc.x, loc.y );

      if( !Math.floor( Math.random() * 3 ) ) {
        var randomTask = tasks.splice( Math.floor( Math.random() * tasks.length ), 1 )[ 0 ];
        randomTask.remove();
      }

      setTimeout( function() {
        step( ++i );
      }, 250 );
    }
  }( 0 ));
})( SVG );
