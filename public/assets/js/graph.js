/* global SVG, jQuery */
/* exported eisenhowerGraph */

/**
 * @todo improve onclick task creation url generation
 * @todo improve task colour selection
 * @todo add hover events for tasks?
 */

var eisenhowerGraph = (function( window, document, SVG, $, undefined ) {
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
   * Get cursor location within the given SVG context
   *
   * @param  {MouseEvent} event MouseEvent object.
   * @param  {Object}     graph Graph (SVGJS) object as context.
   * @return {Object}           Information about the location of the cursor.
   */
  function cursorLocation( event, graph ) {
    var point = graph.node.createSVGPoint();

    point.x = event.clientX;
    point.y = event.clientY;
    point = point.matrixTransform( graph.node.getScreenCTM().inverse() );

    return point;
  }

  /**
   * Returns a hex colour code dependant on provided state
   *
   * @todo choose colour based on value in css.
   *
   * @param  {String} state
   * @return {String}       hex colour code.
   */
  function stateColor( state ) {
    var map = {
      complete: '#4CAF50',
      incomplete: '#FF9800'
    };
    return map[ state ];
  }

  /**
   * Plot a task on a graph
   *
   * @param  {Object} task      Task object from the API
   * @param  {Object} graph     Graph (SVGJS) object
   * @param  {String} [color]   Optional predefined colour for the task.
   * @param  {Number} [opacity] Optional predefined opacity for the task.
   * @return {Object}           SVGJS object for the plotted task
   */
  function plotTask( task, graph, color, opacity ) {
    color = color || stateColor( task.state ) || '#2196F3';
    opacity = opacity || 1;
    icon = ( task.state === 'complete' ) ? '✔' : '×';

    var plot = graph.group().attr( 'class', 'task' );

    // add base circle
    plot.add( graph.circle( 30 ) );

    // add icon to center of plot
    plot.add( graph.text( icon ).font( { size: '1.4em', align: 'center' } ) );
    plot.last().center( plot.first().attr( 'cx' ), plot.first().attr( 'cy' ) );

    // set plot opacity
    plot.opacity( opacity );

    // adjust task coordinates to work on SVG coordinate system
    // Math: plot_coord = ( graph_width / 2 ) + ( ( ( graph_width / 2 ) / 100 ) * task_coord )
    var coordX = 250 + ( 2.5 * task.coordX );
    // we have to invert the value of Y here as svg is from top left not bottom left
    var coordY = 250 + ( 2.5 * -task.coordY );

    // center plot on task coordinates
    plot.center( coordX, coordY );

    // add task details to plot
    plot.data( 'task', task );
    plot.data( 'task-state', task.state );

    // enable tooltip
    plot.data( 'toggle', 'tooltip' );
    plot.attr( 'title', task.description );
    $( plot.node ).tooltip({
      container: 'body',
      // viewport: '#' + graph.attr( 'id' ),
      placement: 'auto'
    });

    // when plot is hovered highlight it and any related elements
    plot.on( 'mouseenter', function() {
      graph.preventPlot = true;

      plot.animate( 400 ).scale( 1.7, 1.7 ).center( coordX, coordY );

      $( '[rel=task-' + task.id + ']' ).addClass( 'highlight' );
    }).on( 'mouseleave', function() {
      graph.preventPlot = false;

      if( task.id === graph.highlightTask ) {
        plot.animate( 400 ).scale( 1.5, 1.5 ).center( coordX, coordY );
      }
      else {
        plot.animate( 400 ).scale( 1, 1 ).center( coordX, coordY );
      }

      $( '[rel=task-' + task.id + ']' ).removeClass( 'highlight' );
    });

    // on plot click visit task details page
    plot.on( 'click', function() {
      window.location.href = '/tasks/' + task.id;
    });

    // when task related element hovered highlight plot
    $( '[rel=task-' + task.id + ']' ).on( 'mouseenter', function() {
      $( this ).addClass( 'highlight' );
      $( plot.node ).tooltip( 'show' );
      plot.animate( 400 ).scale( 1.7, 1.7 ).center( coordX, coordY );
    }).on( 'mouseleave', function() {
      $( this ).removeClass( 'highlight' );
      $( plot.node ).tooltip( 'hide' );
      if( task.id === graph.highlightTask ) {
        plot.animate( 400 ).scale( 1.5, 1.5 ).center( coordX, coordY );
      }
      else {
        plot.animate( 400 ).scale( 1, 1 ).center( coordX, coordY );
      }
    });

    // highlight task if needed
    if( graph.highlightTask ) {
      if( task.id === graph.highlightTask ) {
        plot.scale( 1.5, 1.5 );
        plot.front();
      }
      else {
        plot.opacity( opacity * 0.4 );
      }
    }

    return plot;
  }

  var graphs = [];

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
    var axes = graph.group().attr( 'class', 'axes' );
    axes.add( graph.line( 20, 250, 480, 250 ).stroke( { width: 1 } ) );
    axes.add( graph.line( 250, 20, 250, 480 ).stroke( { width: 1 } ) );
    // add arrow heads
    axes.add( graph.path( 'M 250 20 C 254 28, 258 30, 252 32 L 250 31, 248 32 C 242 30, 246 28, 250 20 Z' ) );
    axes.add( graph.path( 'M 480 250 C 472 254, 470 258, 468 252 L 469 250, 468 248 C 470 242, 472 246, 480 250 Z' ) );

    // add labels
    axes.add( graph.text( 'Most Urgent' ).center( 250, 10 ) );
    axes.add( graph.text( 'Least Urgent' ).center( 250, 490 ) );
    axes.add( graph.text( 'Most Important' ).center( 490, 250 ).rotate( 90 ) );
    axes.add( graph.text( 'Least Important' ).center( 10, 250 ).rotate( -90 ) );

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
      xyPlot.add( graph.circle( 30 ).fill( $self.data( 'color' ) || '#2196F3' ) );

      // add icon to center of plot
      xyPlot.add( graph.text( 'x' ).fill( '#ffffff' ) );
      xyPlot.last().center( xyPlot.first().attr( 'cx' ), xyPlot.first( 'cy' ) );

      // center plot on task coordinates
      xyPlot.center( ( 250 + ( 2.5 * $self.data( 'x' ) ) ), ( 250 + ( 2.5 * -$self.data( 'y' ) ) ) );
    }

    if( $self.data( 'graphNewTask' ) ) {
      // prevent default graph behaviour
      $self.data( 'graphReadonly', true );
      graph.readonly = true;

      xyPlot.scale( 1.5, 1.5 );

      // on click move xyPlot
      graph.on( 'click', function( event ) {
        var loc = cursorLocation( event, graph );

        // move plot
        xyPlot.animate( 400 ).center( loc.x, loc.y );

        // update data attributes to reflect change
        $self.attr( 'data-x', round2dp( ( loc.x - 250 ) / 2.5 ) );
        $self.attr( 'data-y', round2dp( -( loc.y - 250 ) / 2.5 ) );
      });
    }

    // handle graph events
    if( ! $self.data( 'graphReadonly' ) ) {
      graph.readonly = true;
      // on click plot new point and confirm new task
      graph.on( 'click', function( event ) {
        if( ! graph.preventPlot ) {
          var loc = cursorLocation( event, graph );

          // plot point
          var plot = graph.group();

          // add base circle
          plot.add( graph.circle( 30 ).fill( '#2196F3' ) );

          // add icon to center of plot
          plot.add( graph.text( 'x' ).fill( '#ffffff' ) );
          plot.last().center( plot.first().attr( 'cx' ), plot.first( 'cy' ) );

          // center plot on task coordinates
          plot.center( loc.x, loc.y );

          // confirm new task
          if( window.confirm( 'Add new task here?' ) ) {
            // redirect to task creation
            window.location.href = '/tasks/create?' +
                                   ( $self.data( 'topicId' ) ? 'topic=' + $self.data( 'topicId' ) : '' ) +
                                   '&x=' + ( ( loc.x - 250 ) / 2.5 ) +
                                   '&y=' + ( -( loc.y - 250 ) / 2.5 );
          }
          else {
            plot.animate( 400 ).attr( 'opacity', 0 ).after( function() {
              this.remove();
            });
          }
        }
      });
    }

    graphs.push( graph );
  });

  return {
    graphs: graphs,
    plotTask: plotTask,
    cursorLocation: cursorLocation
  };
})( window, document, SVG, jQuery );
