/**
 * @file Defines the Research model
 * @module models/task
 *
 * @license https://www.mozilla.org/MPL/2.0/ MPL-2.0
 */

/**
 * Research Model Export
 *
 * @param  {Sequelize}           sequelize  An instantiated Sequelize class.
 * @param  {Sequelize.DataTypes} DataTypes  An instance of the Sequelize DataTypes class.
 * @return {Sequelize.Model}                The Research model.
 */
module.exports = function( sequelize, DataTypes ) {
  var ResearchData = sequelize.define( 'ResearchData', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    // study running when data collected
    study: {
      type: DataTypes.STRING,
      allowNull: false
    },
    // where the data originated in db (optional)
    sourceModel: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // action that prompted data (optional)
    action: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // some data of interest
    data: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    // user id for a user in the system (or that was)
    UserId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    // method by which data was aquired
    method: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'database hook'
    }
  }, {
    timestamps: true,
    createdAt: 'timestamp',
    updatedAt: false
  });

  return ResearchData;
};
