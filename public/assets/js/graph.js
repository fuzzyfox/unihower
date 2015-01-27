/* global SVG, jQuery */

/**
 * @todo improve onclick task creation url generation
 * @todo improve task colour selection
 * @todo add hover events for tasks?
 */

(function( window, document, SVG, $, undefined ) {
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

  /**
   * Round a number to 2 decimal places
   * @param  {Number} num Number to round
   * @return {Number}     Number to 2 decimal places
   */
  function round2dp( num ) {
    return Math.round( num * 100 ) / 100;
  }

  /**
   * Plot a task on a graph
   *
   * @param  {Object} task  Task object from the API
   * @param  {Object} graph Graph (SVGJS) object
   * @return {Object}       SVGJS object for the plotted task
   */
  function plotTask( task, graph ) {
    var plot = graph.group().attr( 'class', 'task' );

    // add base circle
    plot.add( graph.circle( 30 ).fill( randColor() ) );

    // add icon to center of plot
    plot.add( graph.text( 'x' ).fill( '#ffffff' ) );
    plot.last().center( plot.first().attr( 'cx' ), plot.first( 'cy' ) );

    // adjust task coordinates to work on SVG coordinate system
    // Math: plot_coord = ( graph_width / 2 ) + ( ( ( graph_width / 2 ) / 100 ) * task_coord )
    var coordX = 250 + ( 2.5 * task.coordX );
    // we have to invert the value of Y here as svg is from top left not bottom left
    var coordY = 250 + ( 2.5 * -task.coordY );

    // center plot on task coordinates
    plot.center( coordX, coordY );

    // add task details to plot
    plot.data( 'task', task );

    // handle events for this plot
    plot.on( 'mouseenter', function() {
      graph.preventPlot = true;
    });
    plot.on( 'mouseleave', function() {
      graph.preventPlot = false;
    });

    // highlight task if needed
    if( graph.highlightTask ) {
      if( task.id === graph.highlightTask ) {
        plot.scale( 1.5, 1.5 );
      }
      else {
        plot.opacity( 0.4 );
      }
    }

    return plot;
  }

  // get all graph wrappers
  $( '.eisenhower-graph' ).each( function() {
    // generate a unique id for each graph
    var graphId = 'graph-' + (new Date()).valueOf();
    var $self = $( this );
    $self.attr( 'id', graphId );

    // init graph w/ a blank SVG
    var graph = new SVG( graphId ).attr({
      viewBox: '0 0 500 500',
      x: '0px',
      y: '0px',
      width: $self.data( 'graphSize' ),
      height: $self.data( 'graphSize' ),
      class: 'img-responsive'
    });

    graph.highlightTask = $self.data( 'highlightTask' );

    // draw axes on graph
    var axes = graph.group();
    axes.add( graph.line( 20, 250, 480, 250 ).stroke( { width: 1, color: '#444' } ) );
    axes.add( graph.line( 250, 20, 250, 480 ).stroke( { width: 1, color: '#444' } ) );
    // add arrow heads
    axes.add( graph.path( 'M 250 20 C 254 28, 258 30, 252 32 L 250 31, 248 32 C 242 30, 246 28, 250 20 Z' ).style( { fill: '#444', stroke: '#444' } ) );
    axes.add( graph.path( 'M 480 250 C 472 254, 470 258, 468 252 L 469 250, 468 248 C 470 242, 472 246, 480 250 Z' ).style( { fill: '#444', stroke: '#444' } ) );

    // get topic tasks if they exist
    if( $self.data( 'topicId' ) ) {
      $.getJSON( '/api/topics/' + $self.data( 'topicId' ) + '/tasks', function( data ) {
        data.forEach( function( task ) {
          plotTask( task, graph );
        });
      });
    }

    // get tasks from json api
    if( $self.data( 'tasksUrl' ) ) {
      $.getJSON( $self.data( 'tasksUrl' ), function( data ) {
        data.forEach( function( task ) {
          plotTask( task, graph );
        });
      });
    }

    // plot a point using x,y coord
    if( ( $self.data( 'x' ) !== undefined ) && ( $self.data( 'x' ) !== undefined ) ) {
      // plot point
      var xyPlot = graph.group();

      // add base circle
      xyPlot.add( graph.circle( 30 ).fill( randColor() ) );

      // add icon to center of plot
      xyPlot.add( graph.text( 'x' ).fill( '#ffffff' ) );
      xyPlot.last().center( xyPlot.first().attr( 'cx' ), xyPlot.first( 'cy' ) );

      // center plot on task coordinates
      xyPlot.center( ( 250 + ( 2.5 * $self.data( 'x' ) ) ), ( 250 + ( 2.5 * -$self.data( 'y' ) ) ) );
    }

    if( $self.data( 'graphNewTask' ) ) {
      // prevent default graph behaviour
      $self.data( 'graphReadonly', true );

      // on click move xyPlot
      graph.on( 'click', function( event ) {
        // work out where on graph click was relative to viewbox origin
        var viewboxRatio = ( graph.viewbox().width / graph.parent.offsetWidth );
        var coordX = ( event.layerX - graph.parent.offsetLeft ) * viewboxRatio;
        var coordY = ( event.layerY - graph.parent.offsetTop ) * viewboxRatio;

        // move plot
        xyPlot.center( coordX, coordY );

        // update data attributes to reflect change
        $self.attr( 'data-x', round2dp( ( coordX - 250 ) / 2.5 ) );
        $self.attr( 'data-y', round2dp( -( coordY - 250 ) / 2.5 ) );
      });
    }

    // handle graph events
    if( ! $self.data( 'graphReadonly' ) ) {
      // on click plot new point and confirm new task
      graph.on( 'click', function( event ) {
        if( ! graph.preventPlot ) {
          // work out where on graph click was relative to viewbox origin
          var viewboxRatio = ( graph.viewbox().width / graph.parent.offsetWidth );
          var coordX = ( event.layerX - graph.parent.offsetLeft ) * viewboxRatio;
          var coordY = ( event.layerY - graph.parent.offsetTop ) * viewboxRatio;

          // plot point
          var plot = graph.group();

          // add base circle
          plot.add( graph.circle( 30 ).fill( randColor() ) );

          // add icon to center of plot
          plot.add( graph.text( 'x' ).fill( '#ffffff' ) );
          plot.last().center( plot.first().attr( 'cx' ), plot.first( 'cy' ) );

          // center plot on task coordinates
          plot.center( coordX, coordY );

          // confirm new task
          if( window.confirm( 'Add new task here?' ) ) {
            // redirect to task creation
            window.location.href = '/tasks/create?' +
                                   ( $self.data( 'topicId' ) ? 'topic=' + $self.data( 'topicId' ) : '' ) +
                                   '&x=' + ( ( coordX - 250 ) / 2.5 ) +
                                   '&y=' + ( -( coordY - 250 ) / 2.5 );
          }
          else {
            plot.animate().attr( 'opacity', 0 ).after( function() {
              this.remove();
            });
          }
        }
      });
    }
  });
})( window, document, SVG, jQuery );
