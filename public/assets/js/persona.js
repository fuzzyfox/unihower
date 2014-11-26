/* jshint browser:true */
(function( window, document, undefined ) {
  /*
    Handle Persona Login
   */
  window.navigator.id.watch({
    onlogin: function( assertion ) {
      var xhr = new XMLHttpRequest();
      xhr.open( 'POST', '/persona/verify', true );
      xhr.setRequestHeader( 'Content-Type', 'application/json' );
      xhr.addEventListener( 'loadend', function() {
        var data = JSON.parse( this.responseText );
        if( data && data.status === 'okay' ) {
          console.log( 'You have been logged in as: ' + data.email );
        }
      }, false);

      xhr.send( JSON.stringify({
        assertion: assertion
      }) );
    },
    onlogout: function() {
      var xhr = new XMLHttpRequest();
      xhr.open( 'POST', '/persona/logout', true );
      xhr.addEventListener( 'loadend', function() {
        console.log( 'You have been logged out' );
      });
      xhr.send();
    }
  });

  /*
    Handle Persona Login/out Buttons.
   */
  /**
   * Simplify DOM selection.
   * @param  {String} selector CSS Selector for elements to return.
   * @return {Array}           An array of DOM Nodes that match the given selector.
   */
  var $ = function( selector ) {
    return Array.prototype.slice.call( document.querySelectorAll( selector ) );
  };

  // Login with Persona
  $( '.persona-login' ).forEach( function( element ) {
    element.addEventListener( 'click', function( event ) {
      event.preventDefault();

      window.navigator.id.request();
    });
  });

  // Logout with Persona
  $( '.persona-logout' ).forEach( function( element ) {
    element.addEventListener( 'click', function( event ) {
      event.preventDefault();

      window.navigator.id.logout();
    });
  });
})( window, document );
