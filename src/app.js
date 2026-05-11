const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const fs = require('fs');
const path = require('path');

// Import routes and middlewares
const authRoutes = require('./domains/auth/auth.routes');
const usersRoutes = require('./domains/users/users.routes');
const rolesRoutes = require('./domains/roles/roles.routes');
const applicationsRoutes = require('./domains/applications/applications.routes');
const documentsRoutes = require('./domains/documents/documents.routes');
const auditRoutes = require('./domains/audit/audit.routes');
const errorMiddleware = require('./middleware/error.middleware');

fs.mkdirSync(path.resolve(process.cwd(), 'storage', 'documents'), { recursive: true });

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => res.json({ data: { status: 'ok' } }));
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api', rolesRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api', documentsRoutes);
app.use('/api', auditRoutes);
app.use(errorMiddleware);

module.exports = app;
