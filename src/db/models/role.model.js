module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define('Role', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    description: DataTypes.TEXT,
    is_system_role: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
  }, { tableName: 'roles' });

  Role.associate = (models) => {
    Role.belongsToMany(models.Permission, { through: models.RolePermission, foreignKey: 'role_id' });
    Role.hasMany(models.User, { foreignKey: 'role_id' });
  };

  return Role;
};
