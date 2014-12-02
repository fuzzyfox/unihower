(function( window, document, $, undefined ) {
  var $thisScript = $( 'script[data-persona]' );

  /*
    Handle Persona Login/out
   */
  window.navigator.id.watch({
    loggedInUser: $thisScript.data( 'persona' ) || null,
    onlogin: function( assertion ) {
      $.ajax({
        type: 'POST',
        url: '/persona/verify',
        data: { assertion: assertion }
      }).done( function() {
        window.location.reload();
      }).fail( function() {
        window.navigator.id.logout();
      });
    },
    onlogout: function() {
      $.ajax({
        type: 'POST',
        url: '/persona/logout'
      }).done( function() {
        window.location.reload();
      }).fail( function( xhr, status, error ) {
        window.alert( 'Logout failure: ' + error );
      });
    }
  });

  /*
    Handle Persona Login/out Buttons.
   */
  // Turn login buttons to logout buttons.
  if( ( $thisScript.data( 'persona' ) ) && ( $thisScript.data( 'persona' ) === $thisScript.data( 'user' ) ) ) {
    $( '.persona-login' ).removeClass( 'persona-login' )
                         .addClass( 'persona-logout' )
                         .html( '<i class="fa fa-spinner fa-spin"></i> Logging In' );
  }

  // Login with Persona
  $( '.persona-login' ).on( 'click', function( event ) {
    window.navigator.id.request();

    return false;
  });

  // Logout with Persona
  $( '.persona-logout' ).on( 'click', function( event ) {
    window.navigator.id.logout();

    return false;
  });

  /*
    Handle new user registration
   */
  if( $thisScript.data( 'persona' ) !== $thisScript.data( 'user' ) ) {
    $( '#newUserModal' ).modal( 'show' );
  }

  $( '#newUserModal form' ).on( 'submit', function( event ) {
    event.preventDefault();

    $.ajax({
      type: 'POST',
      url: $( this ).attr( 'action' ),
      data: $( this ).serialize()
    }).done( function( data ) {
      window.location.reload();
    }).fail( function() {
      console.log( arguments );
    });

    return false;
  });
})( window, document, window.jQuery );
