/**
 * @file Defines the User model
 * @module models/user
 *
 * @license https://www.mozilla.org/MPL/2.0/ MPL-2.0
 */
var crypto = require( 'crypto' );

/**
 * User Model Export
 *
 * @param  {Sequelize}           sequelize  An instantiated Sequelize class.
 * @param  {Sequelize.DataTypes} DataTypes  An instance of the Sequelize DataTypes class.
 * @return {Sequelize.Model}                The User model.
 */
module.exports = function( sequelize, DataTypes ) {
  var User = sequelize.define( 'User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING( 70 ),
      allowNull: true,
      defaultValue: ''
    },
    email: {
      type: DataTypes.STRING,
      validate: {
        isEmail: true
      },
      allowNull: false,
      unique: true
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isAdmin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    sendNotifications: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    researchParticipant: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    classMethods: {
      associate: function( models ) {
        User.hasMany( models.Task );
        User.hasMany( models.Topic );
      }
    },
    getterMethods: {
      emailHash: function() {
        return crypto.createHash( 'md5' )
                     .update( this.getDataValue( 'email') )
                     .digest( 'hex' );
      }
    }
  });

  return User;
};
