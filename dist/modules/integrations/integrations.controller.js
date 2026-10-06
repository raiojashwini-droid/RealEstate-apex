"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.testIntegrationHandler = exports.disconnectIntegrationHandler = exports.connectIntegrationHandler = exports.listIntegrationsHandler = void 0;
const intService = __importStar(require("./integrations.service"));
const listIntegrationsHandler = async (req, res, next) => {
    try {
        const data = await intService.getIntegrations();
        res.status(200).json({ success: true, data });
    }
    catch (err) {
        next(err);
    }
};
exports.listIntegrationsHandler = listIntegrationsHandler;
const connectIntegrationHandler = async (req, res, next) => {
    try {
        const actorId = req.user.id;
        const data = await intService.createOrUpdateIntegration(req.body, actorId);
        res.status(200).json({ success: true, data });
    }
    catch (err) {
        next(err);
    }
};
exports.connectIntegrationHandler = connectIntegrationHandler;
const disconnectIntegrationHandler = async (req, res, next) => {
    try {
        const actorId = req.user.id;
        const data = await intService.disconnectIntegration(req.params.id, actorId);
        res.status(200).json({ success: true, data });
    }
    catch (err) {
        next(err);
    }
};
exports.disconnectIntegrationHandler = disconnectIntegrationHandler;
const testIntegrationHandler = async (req, res, next) => {
    try {
        const actorId = req.user.id;
        const data = await intService.testIntegration(req.params.id, actorId);
        res.status(200).json({ success: true, data });
    }
    catch (err) {
        next(err);
    }
};
exports.testIntegrationHandler = testIntegrationHandler;
