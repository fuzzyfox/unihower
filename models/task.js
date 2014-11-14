module.exports = function( sequelize, DataTypes ) {
  var Task = sequelize.define( 'Task', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    description: {
      type: DataTypes.TEXT
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
    paranoid: true,
    classMethods: {
      associate: function( models ) {
        Task.belongsTo( models.User, { foreignKey: 'UserId' } );
        Task.belongsTo( models.Topic, { foreignKey: 'TopicId' } );
      }
    }
  });

  return Task;
};
