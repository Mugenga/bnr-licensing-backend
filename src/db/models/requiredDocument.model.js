module.exports = (sequelize, DataTypes) => {
  const RequiredDocument = sequelize.define('RequiredDocument', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    license_type: { type: DataTypes.STRING(100), allowNull: false },
    document_key: { type: DataTypes.STRING(100), allowNull: false },
    label: { type: DataTypes.STRING(150), allowNull: false },
    sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
  }, {
    tableName: 'required_documents',
    indexes: [{ fields: ['license_type'] }]
  });

  return RequiredDocument;
};
