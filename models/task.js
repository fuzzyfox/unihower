/**
 * @file Defines the Task model
 * @module model/task
 *
 * @license https://www.mozilla.org/MPL/2.0/ MPL-2.0
 */

/**
 * Task Model Export
 *
 * @param  {Sequelize}           sequelize  An instantiated Sequelize class.
 * @param  {Sequelize.DataTypes} DataTypes  An instance of the Sequelize DataTypes class.
 * @return {Sequelize.Model}                The Task model.
 */
module.exports = function( sequelize, DataTypes ) {
  var Task = sequelize.define( 'Task', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    },
    state: {
      type: DataTypes.ENUM,
      allowNull: false,
      defaultValue: 'incomplete',
      values: [
        'incomplete',
        'complete'
      ]
    },
    coordX: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: null,
      validate: {
        min: -100,
        max: 100
      }
    },
    coordY: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: null,
      validate: {
        min: -100,
        max: 100
      }
    }
  }, {
    timestamps: true,
    classMethods: {
      associate: function( models ) {
        Task.belongsTo( models.User, { foreignKey: 'UserId', onDelete: 'cascade' } );
        Task.belongsTo( models.Topic, { foreignKey: 'TopicId', onDelete: 'cascade' } );
      }
    }
  });

  return Task;
};
