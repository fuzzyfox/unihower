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
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    timestamps: true,
    paranoid: false,
    classMethods: {
      associate: function( models ) {
        Topic.belongsTo( models.User, { foreignKey: 'UserId' } );
        Topic.hasMany( models.Task );
      }
    }
  });

  return Topic;
};
