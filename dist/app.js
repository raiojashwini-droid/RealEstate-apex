"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const users_routes_1 = __importDefault(require("./modules/users/users.routes"));
const integrations_routes_1 = __importDefault(require("./modules/integrations/integrations.routes"));
const dashboard_routes_1 = __importDefault(require("./modules/dashboard/dashboard.routes"));
const outreach_routes_1 = __importDefault(require("./modules/outreach/outreach.routes"));
const deals_routes_1 = __importDefault(require("./modules/deals/deals.routes"));
const contacts_routes_1 = __importDefault(require("./modules/contacts/contacts.routes"));
const conversations_routes_1 = __importDefault(require("./modules/conversations/conversations.routes"));
const tasks_routes_1 = __importDefault(require("./modules/tasks/tasks.routes"));
const reports_routes_1 = __importDefault(require("./modules/reports/reports.routes"));
const templates_routes_1 = __importDefault(require("./modules/templates/templates.routes"));
const settings_routes_1 = __importDefault(require("./modules/settings/settings.routes"));
const marketing_routes_1 = __importDefault(require("./modules/marketing/marketing.routes"));
const error_middleware_1 = require("./middleware/error.middleware");
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Request ID middleware mock
app.use((req, res, next) => {
    req.requestId = Math.random().toString(36).substring(7);
    next();
});
// Routes
app.use('/api/v1/auth', auth_routes_1.default);
app.use('/api/v1/users', users_routes_1.default);
app.use('/api/v1/integrations', integrations_routes_1.default);
app.use('/api/v1/dashboard', dashboard_routes_1.default);
app.use('/api/v1/outreach', outreach_routes_1.default);
app.use('/api/v1/deals', deals_routes_1.default);
app.use('/api/v1/contacts', contacts_routes_1.default);
app.use('/api/v1/conversations', conversations_routes_1.default);
app.use('/api/v1/tasks', tasks_routes_1.default);
app.use('/api/v1/reports', reports_routes_1.default);
app.use('/api/v1/templates', templates_routes_1.default);
app.use('/api/v1/settings', settings_routes_1.default);
app.use('/api/v1/marketing', marketing_routes_1.default);
// Health
app.get('/health', (req, res) => {
    res.status(200).json({ success: true, message: 'API is running' });
});
// Error handling
app.use(error_middleware_1.errorMiddleware);
exports.default = app;
