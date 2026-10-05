"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const outreach_controller_1 = require("./outreach.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.get('/pipeline', outreach_controller_1.getOutreachPipelineHandler);
exports.default = router;
