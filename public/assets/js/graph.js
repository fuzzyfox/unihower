/* global SVG, jQuery */
/* exported eisenhowerGraph */
/**
 * @file provides an abstraction of the the task graph SVG and supporting
 * actions associated with it.
 *
 * @license https://www.mozilla.org/MPL/2.0/ MPL-2.0
 *
 * Requires Sugar.js, SVG.js, and jQuery
 * @see {@link http://sugarjs.com}
 * @see {@link http://documentup.com/wout/svg.js}
 * @see {@link https://jquery.com/}
 *
 * @todo improve onclick task creation url generation
 */

/**
 * Eisenhower Graph Interface(s).
 *
 * Provides an easy way to create/interact with task graph SVGs.
 *
 * @example
 *
 *  // plot a point on an existing graph (when only one on page) using the SVG
 *  // coordinate system
 *  var graph = eisenhowerGraph.graphs[ 0 ];
 *  graph.basicPlot( 234, 120 );
 *
 * @example
 *
 *  // plot a point on an existing graph (when only one on page) using the
 *  // task oriented coordinate system
 *  var graph = eisenhowerGraph.graphs[ 0 ];
 *  graph.plotTask( {
 *    coordX: 42,
 *    coordY: 42,
 *    description: "Determine the answer to the ultimate question.",
 *    TopicId: 42
 *  } );
 *
 * @return {Object}
 */
var eisenhowerGraph = (function( window, document, SVG, $, undefined ) {
  /* --------------------------------------------------
    Utility Functions
  -------------------------------------------------- */

  /**
   * Generate random pastel colour.
   *
   * @return {String} CSS stlye hex colour value
   */
  function randomColor() {
    var getVal = function() {
      return ( Math.round( Math.random() * 110 ) + 110 ).toString( 16 );
    };

    return '#' + getVal() + getVal() + getVal();
  }

  /* --------------------------------------------------
    Plotting Functions
  -------------------------------------------------- */

  /**
   * Creates a basic plot on the graph.
   *
   * @param  {Number} x         SVG x-coordinate for plot point
   * @param  {Number} y         SVG y-coordinate for plot point
   * @param  {Object} [options] Base options for a plot point
   * @return {SVG.G}            SVG group containing plot
   */
  function basicPlot( x, y, options ) {
    var self = this;

    // in read only mode return empty object
    if( self._readonly ) {
      return {};
    }

    // set options
    options = Object.merge({
      fill: randomColor(),
      color: '#ffffff',
      icon: ''
    }, options, true );

    // create plot
    var plot = self.group().addClass( 'plot' );

    // add plot to collection
    self.plots.add( plot );

    // draw backing circle
    var circle = self.circle( 30 );
    if( options.fill ) {
      // optionally add fill colour to circle
      circle.fill( options.fill );
    }
    plot.add( circle );

    // draw icon in center
    var icon = self.text( options.icon ).font({
      align: 'center',
      family: 'FontAwesome'
    });
    if( options.color ) {
      // optionally add fill colour to text
      icon.fill( options.color );
    }
    plot.add( icon );

    // center icon in circle
    plot.last().center( plot.first().attr( 'cx' ), plot.first().attr( 'cy' ) );

    // move plot to correct location
    plot.center( x, y );

    return plot;
  }

  /**
   * Convert event (mouse or touch) location to SVG point
   *
   * @param  {Event} event Mouse or Touch event
   * @return {SVGPoint}    An SVG Point at click location
   */
  function eventPointToSVGPoint( event ) {
    var self = this;

    // get a new svg point
    var point = self.node.createSVGPoint();

    // set its x,y to click event's x,y
    point.x = event.clientX;
    point.y = event.clientY;

    // correct point x,y to account for difference between click origin
    // and svg origin points.
    point = point.matrixTransform( self.node.getScreenCTM().inverse() );

    return point;
  }

  /**
   * Plot a task on the graph.
   *
   * @param  {Task}  task Instance of the task model
   * @return {SVG.G}      SVG group that is a plot
   */
  function plotTask( task ) {
    // trashonly mode check
    if( this._trashonly && !task.deletedAt ) {
      return {};
    }

    // convert origin center coords to origin top left.
    var x = 250 + ( 2.5 * task.coordX );
    var y = 250 + ( 2.5 * -task.coordY );

    // plot on graph
    var plot = this.basicPlot( x, y, {
      color: false,
      fill: false,
      icon: ( task.state === 'complete' ) ? '' : ''
    });

    // store task data to plot
    plot.data( 'task', task );

    // store tasks state + id separately
    plot.data( 'task-state', task.state );
    plot.data( 'task-id', task.id );

    // setup tooltips
    plot.data( 'toggle', 'tooltip' );
    plot.attr( 'title', task.description );
    $( plot.node ).tooltip({
      container: 'body',
      placement: 'auto'
    });

    // add task class
    plot.addClass( 'task' );

    return plot;
  }

  /**
   * Highlight a given task by id.
   *
   * Task is highlighted by scaling up slightly, and by reducing the opacity of
   * all other tasks on the graph.
   *
   * The highlighted task will then have the class "highlight" applied
   *
   * @param  {Number} taskId ID for a task to hightlight
   */
  function highlightTask( taskId ) {
    var self = this;
    self.plots.each( function() {
      if( this.hasClass( 'task' ) && this.data( 'task' ).id === taskId ) {
        this.scale( 1.2, 1.2 ).center( this.cx(), this.cy() ).addClass( 'highlight' );
      }
      else {
        this.opacity( 0.4 );
      }
    });
  }

  /* --------------------------------------------------
    Generate graphs
  -------------------------------------------------- */

  /**
   * Hashmap of graphs (extended).
   *
   * @type {Object}
   */
  var graphs = {};

  // for each graph wrapper found create a graph
  $( '.eisenhower-graph' ).each( function() {
    var graphId = 'graph-' + ( new Date() ).valueOf();
    var $self = $( this );
    $self.attr( 'id', graphId );

    /**
     * SVG element wrapped in SVG.JS happiness.
     *
     * @type {SVG}
     */
    var graph = new SVG( graphId ).attr({
      viewBox: '0 0 500 500',
      x: '0px',
      y: '0px',
      class: 'img-responsive'
    });

    /**
     * SVG Group containing the graphs axes.
     *
     * @type {SVG.G}
     */
    var axes = graph.group().addClass( 'axes' );
    // add axes
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

    // extend custom methods onto graph
    graph = Object.merge( graph, {
      basicPlot: basicPlot,
      plotTask: plotTask,
      highlightTask: highlightTask,
      eventPointToSVGPoint: eventPointToSVGPoint,
      /**
       * Graph readonly mode flag.
       *
       * @type {Boolean}
       */
      _readonly: false,
      /**
       * Flag to indicate graph should only show "trashed" tasks.
       *
       * @type {Boolean}
       */
      _trashonly: false,
      /**
       * SVG group to contain all plot points.
       *
       * @type {SVG.G}
       */
      plots: graph.group(),
      /**
       * Toggle graph readonly mode on/off.
       */
      toggleReadonly: function() {
        this._readonly = !this._readonly;
      },
      /**
       * Determine if readonly mode is on.
       *
       * @return {Boolean} True for readonly
       */
      isReadonly: function() {
        return this._readonly;
      },
      /**
       * Clear plots from graph w/o affecting axes.
       */
      clear: function() {
        this.plots.clear();
      }
    } );

    // push graph into collection
    graphs[ graphId ] = graph;
  });

  /* --------------------------------------------------
    Handle Events
  -------------------------------------------------- */

  /**
   * Flag for detecting dragging events.
   *
   * @type {Boolean}
   */
  var isDragging = false;

  $( '.eisenhower-graph' )
    /*
      Handle hovering of plots
     */
    .on( 'mouseenter', '.plot', function() {
      // get relevant plot
      var plot = SVG.get( $( this ).attr( 'id' ) );

      // highlight plot
      plot
        .animate( 400 )
        .scale( 1.2, 1.2 )
        .center( plot.cx(), plot.cy() );

      if( plot.hasClass( 'task' ) ) {
        // highlight elements related to this plot
        $( '[rel=task-' + plot.data( 'task' ).id + ']' ).addClass( 'highlight' );
      }
    })
    .on( 'mouseleave', '.plot', function() {
      // get relevant plot
      var plot = SVG.get( $( this ).attr( 'id' ) );

      // restore plot
      if( !plot.hasClass( 'highlight' ) ) {
        plot
          .animate( 400 )
          .scale( 1, 1 )
          .center( plot.cx(), plot.cy() );
      }

      if( plot.hasClass( 'task' ) ) {
        // un-highlight elements related to this plot
        $( '[rel=task-' + plot.data( 'task' ).id + ']' ).removeClass( 'highlight' );
      }
    })
    /*
      Handle dragging of plots
     */
    .on( 'mousedown touchstart', '.plot', function( event ) {
      // cache context here
      var self = this;

      // get the relevant graph for action
      var graph = graphs[ $( event.delegateTarget ).attr( 'id' ) ];

      // detect drag start
      $( window ).on( 'mousemove touchmove', function( event ) {
        if( graph.isReadonly() && !isDragging ) {
          // clear event listener
          $( window ).off( 'mousedown touchmove' );
          return;
        }
        // force set readonly
        graph._readonly = true;

        // prevent system default action
        event.preventDefault();
        // flag that dragging event happening
        isDragging = true;

        // clear event listener
        $( window ).off( 'mousedown touchmove' );

        // get plot point and reposition
        var plot = SVG.get( $( self ).attr( 'id' ) );
        var point = graph.eventPointToSVGPoint( event );
        plot.center( point.x, point.y );

        // force plot to front
        plot.front();
      });
    })
    .on( 'mouseup touchend', '.plot', function( event ) {
      // cache dragging flag
      var wasDragging = isDragging;
      isDragging = false;

      // clear any leftover moving events
      $( window ).off( 'mousemove touchmove' );

      // detect drag stop
      if( wasDragging ) {
        event.preventDefault();
        event.stopPropagation();

        // get relevant graph for action
        var graph = graphs[ $( event.delegateTarget ).attr( 'id' ) ];
        // remove readonly
        graph._readonly = false;

        return false;
      }
    })
    /*
      Handle clicking plots
     */
    .on( 'click', '.plot', function( event ) {
      // prevent event bubble
      event.stopImmediatePropagation();
      // get relevant plot
      var plot = SVG.get( $( this ).attr( 'id' ) );
      // force plot to front
      plot.front();

      // get parent graph
      var graph = graphs[ $( event.delegateTarget ).attr( 'id' ) ];

      if( !graph.isReadonly() && plot.hasClass( 'task' ) ) {
        window.location.href = '/tasks/' + plot.data( 'task' ).id;
      }
    })
    /*
      Handle clicking of graph
     */
    .on( 'click', function( event ) {
      // get graph event happened to
      var graph = graphs[ $( this ).attr( 'id' ) ];
      // convert event point to something useful
      var point = graph.eventPointToSVGPoint( event );
      // plot the point
      var plot = graph.basicPlot( point.x, point.y, { fill: false, color: false } );

      if( graph.isReadonly() ) {
        return;
      }

      // attempt to figure out topic id for this graph
      var topicId = $( this ).data( 'topicId' ) ||
                    $( this ).data( 'tasksUrl' ).toString().match( /\/topics\/(\d+)/i );
      if( Array.isArray( topicId ) ) {
        topicId = topicId[ 1 ];
      }
      if( topicId === null ) {
        topicId = undefined;
      }

      // confirm with user that we should create a task here
      if( window.confirm( 'Create task here?' ) ) {
        window.location.href = '/tasks/create?' + Object.toQueryString({
          x: ( ( point.x - 250 ) / 2.5 ).round( 2 ),
          y: ( -( point.y - 250 ) / 2.5 ).round( 2 ),
          topic: topicId
        });

        return;
      }

      plot.animate( 400 ).opacity( 0 ).after( function() {
        this.remove();
      });
    });

  /*
    Task related element hover trigger task plot highlight
   */
  $( '[rel^=task-]' )
    .on( 'mouseenter', function( event ) {
      // determine task id
      var taskId = parseInt( $( this ).attr( 'rel' ).match( /(\d+)/i )[ 1 ], 10 );
      // get plot for task
      var plot = SVG.get( $( '.eisenhower-graph .task[data-task-id=' + taskId + ']' ).attr( 'id' ) );

      // highlight plot
      plot
        .animate( 400 )
        .scale( 1.2, 1.2 )
        .center( plot.cx(), plot.cy() );

      // trigger tooltip
      $( plot.node ).tooltip( 'show' );

      // highlight this element
      $( this ).addClass( 'highlight' );
    })
    .on( 'mouseleave', function( event ) {
      // determine task id
      var taskId = parseInt( $( this ).attr( 'rel' ).match( /(\d+)/i )[ 1 ], 10 );
      // get plot for task
      var plot = SVG.get( $( '.eisenhower-graph .task[data-task-id=' + taskId + ']' ).attr( 'id' ) );

      // restore plot point
      if( !plot.hasClass( 'highlight' ) ) {
        plot
          .animate( 400 )
          .scale( 1, 1 )
          .center( plot.cx(), plot.cy() );
      }

      // close tooltip
      $( plot.node ).tooltip( 'hide' );

      // un-highlight this element
      $( this ).removeClass( 'highlight' );
    });

  /* --------------------------------------------------
    Preloading Tasks
  -------------------------------------------------- */

  $( '.eisenhower-graph' ).each( function() {
    var $self = $( this );
    var graph = graphs[ $self.attr( 'id' ) ];

    /*
      Load tasks in based on topic id
     */
    if( $self.data( 'topicId' ) ) {
      $.getJSON( '/api/topics/' + $self.data( 'topicId' ) + '/tasks', function( tasks ) {
        // force writable graph
        var wasReadonly = graph.isReadonly();
        graph._readonly = false;

        // create plots for tasks
        tasks.forEach( function( task ) {
          graph.plotTask( task );
        });

        // reset readonly
        graph._readonly = wasReadonly;
      });
    }
    /*
      Load tasks in based on api url
     */
    else if( $self.data( 'tasksUrl' ) ) {
      $.getJSON( $self.data( 'tasksUrl' ), function( tasks ) {
        // force writable graph
        var wasReadonly = graph.isReadonly();
        graph._readonly = false;

        // create plots for tasks
        tasks.forEach( function( task ) {
          graph.plotTask( task );
        });

        // reset readonly
        graph._readonly = wasReadonly;
      });
    }
  });

  /* --------------------------------------------------
    Data Attribute Config
  -------------------------------------------------- */

  $( '.eisenhower-graph' ).each( function() {
    var $self = $( this );
    var graph = graphs[ $self.attr( 'id' ) ];

    /*
      Create plot point based on x,y coordinates.
     */
    if( ( $self.data( 'x' ) !== undefined ) && ( $self.data( 'y' ) !== undefined ) ) {
      (function() {
        // convert x,y from origin center to origin top left
        var x = 250 + ( 2.5 * $self.data( 'x' ) );
        var y = 250 + ( 2.5 * -$self.data( 'y' ) );

        // create plot point
        graph.basicPlot( x, y, { fill: false, color: false } );
      }());
    }

    /*
      Determine if we should hightlight a task.

      This is performed on load and on completion of any ajax
      request to the api.
     */
    if( $self.data( 'highlightTask' ) ) {
      $( document ).ajaxComplete( function( event, xhr, settings ) {
        if( /\/api\/.*\/tasks/i.test( settings.url ) ) {
          graph.highlightTask( $self.data( 'highlightTask' ) );
        }
      });
    }

    /*
      Determine if graph should be readonly.
     */
    if( $self.data( 'graphReadonly') ) {
      graph._readonly = true;
    }

    if( $self.data( 'trashOnly' ) ) {
      graph._readonly = true;
      graph._trashonly = true;
    }
  });

  /* --------------------------------------------------
    New task special case
  -------------------------------------------------- */

  // This sepcial case requires that a task is plotted using x,y coordinates
  // and that this is the only plot on the graph which is NOT a predefined task.
  $( '.eisenhower-graph' ).each( function() {
    var $self = $( this );
    var graph = graphs[ $self.attr( 'id' ) ];

    // check if new task mode
    if( !$self.data( 'graphNewTask' ) ) {
      return;
    }

    // put graph into readonly mode
    graph._readonly = true;
    var plot = SVG.get( $( graph.node ).find( '.plot:not(.task):first' ).attr( 'id' ) );

    // custom graph click event handling
    $self.on( 'mouseup touchend', function( event ) {
      // move point to click location
      var point = graph.eventPointToSVGPoint( event );
      plot.animate( 400 ).center( point.x, point.y );

      // update data attr's
      $self.attr( 'data-x', ( ( point.x - 250 ) / 2.5 ).round( 2 ) );
      $self.attr( 'data-y', ( -( point.y - 250 ) / 2.5 ).round( 2 ) );

      // force plot front
      plot.front();
    });

    // custom drag support
    var isDragging = false;
    $( plot.node ).on( 'mousedown touchstart', function( event ) {
      // cache context here
      var self = this;

      // detect drag start
      $( window ).on( 'mousemove touchmove', function( event ) {
        // prevent system default action
        event.preventDefault();
        // flag that dragging event happening
        isDragging = true;

        // clear event listener
        $( window ).off( 'mousedown touchmove' );

        // get plot point and reposition
        var plot = SVG.get( $( self ).attr( 'id' ) );
        var point = graph.eventPointToSVGPoint( event );
        plot.center( point.x, point.y );

        // force plot to front
        plot.front();

        // update data attributes with new location
        $self.attr( 'data-x', ( ( point.x - 250 ) / 2.5 ).round( 2 ) );
        $self.attr( 'data-y', ( -( point.y - 250 ) / 2.5 ).round( 2 ) );
      });
    })
    .on( 'mouseup touchend', '.plot', function( event ) {
      // cache dragging flag
      var wasDragging = isDragging;
      isDragging = false;

      // clear any leftover moving events
      $( window ).off( 'mousemove touchmove' );

      // detect drag stop
      if( wasDragging ) {
        event.preventDefault();
        event.stopPropagation();

        return false;
      }
    });
  });

  /* --------------------------------------------------
    Exports
  -------------------------------------------------- */

  return {
    graphs: graphs,
    // backwards compat till certain no longer needed
    plotTask: function( task, graph ) {
      graph.plotTask( task );
    },
    cursorLocation: function( event, graph ) {
      graph.eventPointToSVGPoint( event );
    }
  };
})( window, document, SVG, jQuery );
