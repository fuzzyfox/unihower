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
    }
  }, {
    classMethods: {
      associate: function( models ) {
        User.hasMany( models.Task );
        User.hasMany( models.Topic );
      }
    }
  });

  return User;
};
