/**
 * @file Allows for user theme selection.
 *
 * Selected theme will be stored in a cookie and is not attached to the users
 * account but rather the device.
 */

(function( window, document, $ ){
  $( function() {
    $( '#themeSelector' ).on( 'change', function() {
      var theme = $( this ).val();
      console.log( theme );
      document.cookie = encodeURIComponent( 'theme' ) + "=" + encodeURIComponent( theme );

      var $stylesheet = $( 'link[href^="/assets/css/eisenhower-"]' );
      var $newStylesheet = $( '<link rel="stylesheet" href="/assets/css/eisenhower-' + theme + '.css">' ).insertAfter( $stylesheet );
      var $transitonalStylesheet = $( '<style>* { transition: all .7s ease; }</style>' ).insertAfter( $stylesheet );
      $newStylesheet[ 0 ].onload = function() {
        setTimeout( function() {
          $stylesheet.remove();
          $transitonalStylesheet.remove();
        }, 250 );
      }
    });
  });
})( this, this.document, jQuery )
