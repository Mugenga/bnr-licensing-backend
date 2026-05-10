module.exports = (sequelize, DataTypes) => {
  const Permission = sequelize.define('Permission', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    description: DataTypes.TEXT
  }, { tableName: 'permissions' });

  Permission.associate = (models) => {
    Permission.belongsToMany(models.Role, { through: models.RolePermission, foreignKey: 'permission_id' });
  };

  return Permission;
};
