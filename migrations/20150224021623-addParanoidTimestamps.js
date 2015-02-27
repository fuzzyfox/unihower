'use strict';

module.exports = {
  up: function( migration, DataTypes ) {
    var taskMigration = migration.addColumn( 'Tasks', 'deletedAt', {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    }).catch( function( err ) {
      if( err.original.code !== 'ER_DUP_FIELDNAME' ) {
        throw err;
      }

      migration.sequelize.options.logging( 'NOTICE: Migration not run on Tasks due to lack of need.' );
      return this;
    });

    return migration.addColumn( 'Topics', 'deletedAt', {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    }).then( function() {
      return taskMigration;
    }).catch( function( err ) {
      if( err.original.code !== 'ER_DUP_FIELDNAME' ) {
        throw err;
      }

      migration.sequelize.options.logging( 'NOTICE: Migration not run on Topics due to lack of need.' );
      return taskMigration;
    });
  },

  down: function( migration, DataTypes, done ) {
    var taskMigration = migration.removeColumn( 'Tasks', 'deletedAt' ).catch( function( err ) {
      if( err.original.code !== 'ER_CANT_DROP_FIELD_OR_KEY' ) {
        throw err;
      }

      migration.sequelize.options.logging( 'WARNING: Migration not run on Tasks this should no be a problem however you may wish to manually remove database.Topics( `deletedAt` ).' );
    });

    return migration.removeColumn( 'Topics', 'deletedAt' ).then( function() {
      return taskMigration;
    }).catch( function( err ) {
      if( err.original.code !== 'ER_CANT_DROP_FIELD_OR_KEY' ) {
        throw err;
      }

      migration.sequelize.options.logging( 'WARNING: Migration not run on Topics this should no be a problem however you may wish to manually remove database.Topics( `deletedAt` ).' );
    });
  }
};
