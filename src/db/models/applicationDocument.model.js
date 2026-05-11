module.exports = (sequelize, DataTypes) => {
  const ApplicationDocument = sequelize.define('ApplicationDocument', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    application_id: { type: DataTypes.UUID, allowNull: false },
    uploaded_by: { type: DataTypes.UUID, allowNull: false },
    original_name: { type: DataTypes.STRING(255), allowNull: false },
    stored_name: { type: DataTypes.STRING(255), allowNull: false },
    document_type: DataTypes.STRING(100),
    mime_type: { type: DataTypes.STRING(100), allowNull: false },
    size_bytes: { type: DataTypes.INTEGER, allowNull: false },
    version: { type: DataTypes.INTEGER, allowNull: false }
  }, {
    tableName: 'application_documents',
    indexes: [{ fields: ['application_id'] }, { fields: ['uploaded_by'] }]
  });

  ApplicationDocument.associate = (models) => {
    ApplicationDocument.belongsTo(models.Application, { foreignKey: 'application_id' });
    ApplicationDocument.belongsTo(models.User, { as: 'Uploader', foreignKey: 'uploaded_by' });
  };

  return ApplicationDocument;
};
