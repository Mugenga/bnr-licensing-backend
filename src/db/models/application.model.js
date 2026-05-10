module.exports = (sequelize, DataTypes) => {
  const Application = sequelize.define('Application', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    reference_number: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    applicant_user_id: { type: DataTypes.UUID, allowNull: false },
    institution_name: { type: DataTypes.STRING(200), allowNull: false },
    license_type: { type: DataTypes.STRING(100), allowNull: false },
    description: DataTypes.TEXT,
    status: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'draft' },
    reviewed_by: DataTypes.UUID,
    reviewed_at: DataTypes.DATE,
    final_decision_by: DataTypes.UUID,
    final_decision_at: DataTypes.DATE,
    final_decision_note: DataTypes.TEXT,
    version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
  }, {
    tableName: 'applications',
    indexes: [
      { fields: ['status'] },
      { fields: ['applicant_user_id'] },
      { fields: ['reviewed_by'] }
    ]
  });

  Application.associate = (models) => {
    Application.belongsTo(models.User, { as: 'Applicant', foreignKey: 'applicant_user_id' });
    Application.belongsTo(models.User, { as: 'Reviewer', foreignKey: 'reviewed_by' });
    Application.belongsTo(models.User, { as: 'DecisionMaker', foreignKey: 'final_decision_by' });
    Application.hasMany(models.ApplicationDocument, { foreignKey: 'application_id' });
    Application.hasMany(models.AuditLog, { foreignKey: 'application_id' });
  };

  return Application;
};
