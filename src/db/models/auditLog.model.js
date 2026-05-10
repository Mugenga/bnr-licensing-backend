module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define('AuditLog', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    application_id: { type: DataTypes.UUID, allowNull: false },
    actor_user_id: { type: DataTypes.UUID, allowNull: false },
    action: { type: DataTypes.STRING(100), allowNull: false },
    from_status: DataTypes.STRING(50),
    to_status: DataTypes.STRING(50),
    metadata: DataTypes.JSON
  }, {
    tableName: 'audit_logs',
    updatedAt: false,
    indexes: [
      { fields: ['application_id'] },
      { fields: ['actor_user_id'] },
      { fields: ['created_at'] }
    ]
  });

  AuditLog.associate = (models) => {
    AuditLog.belongsTo(models.Application, { foreignKey: 'application_id' });
    AuditLog.belongsTo(models.User, { as: 'Actor', foreignKey: 'actor_user_id' });
  };

  AuditLog.beforeUpdate(() => {
    throw new Error('audit_logs are append-only and cannot be modified or deleted');
  });
  AuditLog.beforeDestroy(() => {
    throw new Error('audit_logs are append-only and cannot be modified or deleted');
  });

  return AuditLog;
};
