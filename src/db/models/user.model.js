module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    full_name: { type: DataTypes.STRING(150), allowNull: false },
    email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
    password_hash: { type: DataTypes.TEXT, allowNull: false },
    role_id: { type: DataTypes.UUID, allowNull: false },
    organization_name: DataTypes.STRING(200),
    status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'active' }
  }, { tableName: 'users' });

  User.associate = (models) => {
    User.belongsTo(models.Role, { foreignKey: 'role_id' });
    User.hasMany(models.Application, { foreignKey: 'applicant_user_id' });
  };

  return User;
};
