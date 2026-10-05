"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const integrations_controller_1 = require("./integrations.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const rbac_middleware_1 = require("../../middleware/rbac.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.use(rbac_middleware_1.requireAdmin);
router.get('/', integrations_controller_1.listIntegrationsHandler);
router.post('/', integrations_controller_1.connectIntegrationHandler); // Connect or Update
router.post('/:id/disconnect', integrations_controller_1.disconnectIntegrationHandler);
router.post('/:id/test', integrations_controller_1.testIntegrationHandler);
exports.default = router;
