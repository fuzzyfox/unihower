'use strict';

module.exports = {
  up: function( migration, DataTypes ) {
    return migration.addColumn( 'Topics', 'deletedAt', {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    }).then( function() {
      return migration.addColumn( 'Tasks', 'deletedAt', {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
      });
    });
  },

  down: function( migration, DataTypes, done ) {
    return migration.removeColumn( 'Topics', 'deletedAt' ).then( function() {
      return migration.removeColumn( 'Tasks', 'deletedAt' );
    });
  }
};
