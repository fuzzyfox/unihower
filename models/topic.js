/**
 * @file Defines the Topic model
 * @module models/topic
 *
 * @license https://www.mozilla.org/MPL/2.0/ MPL-2.0
 */

/**
 * Topic Model Export
 *
 * @param  {Sequelize}           sequelize  An instantiated Sequelize class.
 * @param  {Sequelize.DataTypes} DataTypes  An instance of the Sequelize DataTypes class.
 * @return {Sequelize.Model}                The Topic model.
 */
module.exports = function( sequelize, DataTypes ) {
  var Topic = sequelize.define( 'Topic', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING( 70 ),
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    timestamps: true,
    paranoid: false,
    classMethods: {
      associate: function( models ) {
        Topic.belongsTo( models.User, { foreignKey: 'UserId', onDelete: 'cascade' } );
        Topic.hasMany( models.Task );
      }
    }
  });

  return Topic;
};
