process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.EMAIL_ENABLED = 'false';

const { sequelize, Role, Permission, RolePermission, User, Application, AuditLog } = require('../src/db/models');
const { DEFAULT_PERMISSIONS, ROLE_PERMISSION_MAP } = require('../src/domains/applications/applicationPermissions');
const { hashPassword } = require('../src/utils/password');

let synced = false;

async function loadUserWithPermissions(id) {
  const user = await User.findByPk(id, { include: [Role] });
  const rows = await RolePermission.findAll({ where: { role_id: user.role_id }, include: [Permission] });
  user.Role.Permissions = rows.map((row) => row.Permission);
  return user;
}

async function seedTestData() {
  if (!synced) {
    await sequelize.sync({ force: true });
    synced = true;
  } else {
    await AuditLog.destroy({ where: {}, truncate: true, cascade: true, hooks: false });
    await Application.destroy({ where: {}, truncate: true, cascade: true, hooks: false });
    await User.destroy({ where: {}, truncate: true, cascade: true, hooks: false });
    await RolePermission.destroy({ where: {}, truncate: true, cascade: true, hooks: false });
    await Permission.destroy({ where: {}, truncate: true, cascade: true, hooks: false });
    await Role.destroy({ where: {}, truncate: true, cascade: true, hooks: false });
  }
  const permissions = {};
  for (const name of DEFAULT_PERMISSIONS) {
    permissions[name] = await Permission.create({ name, description: name });
  }

  const roles = {};
  for (const name of Object.keys(ROLE_PERMISSION_MAP)) {
    roles[name] = await Role.create({ name, description: name, is_system_role: true });
    for (const permissionName of ROLE_PERMISSION_MAP[name]) {
      await RolePermission.create({ role_id: roles[name].id, permission_id: permissions[permissionName].id });
    }
  }

  const password_hash = await hashPassword('Password123!');
  const users = {
    applicant: await User.create({ full_name: 'Applicant', email: 'applicant@test.local', password_hash, role_id: roles.applicant.id, organization_name: 'Applicant Bank' }),
    otherApplicant: await User.create({ full_name: 'Other Applicant', email: 'other@test.local', password_hash, role_id: roles.applicant.id, organization_name: 'Other Bank' }),
    officer: await User.create({ full_name: 'Officer', email: 'officer@test.local', password_hash, role_id: roles.officer.id }),
    approver: await User.create({ full_name: 'Approver', email: 'approver@test.local', password_hash, role_id: roles.approver.id }),
    superadmin: await User.create({ full_name: 'Superadmin', email: 'superadmin@test.local', password_hash, role_id: roles.superadmin.id })
  };

  for (const key of Object.keys(users)) {
    users[key] = await loadUserWithPermissions(users[key].id);
  }

  return { roles, permissions, users };
}

global.testDb = { sequelize, Role, Permission, RolePermission, User, Application, AuditLog, seedTestData, loadUserWithPermissions };

afterAll(async () => {
  await sequelize.close();
});
