import express from 'express';
import cors from 'cors';
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import integrationsRoutes from './modules/integrations/integrations.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import outreachRoutes from './modules/outreach/outreach.routes';
import dealsRoutes from './modules/deals/deals.routes';
import contactsRoutes from './modules/contacts/contacts.routes';
import conversationsRoutes from './modules/conversations/conversations.routes';
import tasksRoutes from './modules/tasks/tasks.routes';
import reportsRoutes from './modules/reports/reports.routes';
import templatesRoutes from './modules/templates/templates.routes';
import settingsRoutes from './modules/settings/settings.routes';
import marketingRoutes from './modules/marketing/marketing.routes';
import { errorMiddleware } from './middleware/error.middleware';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request ID middleware mock
app.use((req, res, next) => {
  (req as any).requestId = Math.random().toString(36).substring(7);
  next();
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/integrations', integrationsRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/outreach', outreachRoutes);
app.use('/api/v1/deals', dealsRoutes);
app.use('/api/v1/contacts', contactsRoutes);
app.use('/api/v1/conversations', conversationsRoutes);
app.use('/api/v1/tasks', tasksRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/templates', templatesRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/marketing', marketingRoutes);

// Health
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'API is running' });
});

// Error handling
app.use(errorMiddleware);

export default app;
