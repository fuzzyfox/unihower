module.exports = function( env ) {
  return function( req, res ) {
    res.jsonp({
      version: env.get( 'pkg' ).version,
      http: 'okay'
    });
  };
};
