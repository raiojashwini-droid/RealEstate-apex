"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testIntegration = exports.disconnectIntegration = exports.createOrUpdateIntegration = exports.getIntegrations = void 0;
const prisma_1 = __importDefault(require("../../prisma"));
const crypto_util_1 = require("../../utils/crypto.util");
const twilio_provider_1 = require("../../services/integrations/twilio.provider");
const microsoft365_provider_1 = require("../../services/integrations/microsoft365.provider");
const openai_provider_1 = require("../../services/integrations/openai.provider");
const getIntegrations = async () => {
    const integrations = await prisma_1.default.integration.findMany();
    // Never return raw credentials
    return integrations.map(int => ({
        id: int.id,
        name: int.name,
        type: int.type,
        status: int.status,
        config: int.config ? JSON.parse(int.config) : null,
        maskedCredential: '••••' + (int.credentials ? ' (Configured)' : ' (Not Configured)'),
        lastTestedAt: int.lastTestedAt,
        lastError: int.lastError,
    }));
};
exports.getIntegrations = getIntegrations;
const createOrUpdateIntegration = async (data, actorId) => {
    const { type, name, secrets, config } = data;
    const encryptedCredentials = (0, crypto_util_1.encryptSecret)(JSON.stringify(secrets));
    const configString = config ? JSON.stringify(config) : null;
    const existing = await prisma_1.default.integration.findFirst({ where: { type } });
    let integration;
    if (existing) {
        integration = await prisma_1.default.integration.update({
            where: { id: existing.id },
            data: {
                name: name || existing.name,
                credentials: encryptedCredentials,
                config: configString,
                updatedById: actorId,
            }
        });
    }
    else {
        integration = await prisma_1.default.integration.create({
            data: {
                name,
                type,
                credentials: encryptedCredentials,
                config: configString,
                status: 'CONNECTED',
                createdById: actorId,
                updatedById: actorId,
            }
        });
    }
    await prisma_1.default.auditLog.create({
        data: {
            actorUserId: actorId,
            action: existing ? 'INTEGRATION_UPDATE' : 'INTEGRATION_CONNECT',
            entityType: 'Integration',
            entityId: integration.id
        }
    });
    return { id: integration.id, status: integration.status };
};
exports.createOrUpdateIntegration = createOrUpdateIntegration;
const disconnectIntegration = async (id, actorId) => {
    const integration = await prisma_1.default.integration.update({
        where: { id },
        data: {
            status: 'DISCONNECTED',
            updatedById: actorId
        }
    });
    await prisma_1.default.auditLog.create({
        data: {
            actorUserId: actorId,
            action: 'INTEGRATION_DISCONNECT',
            entityType: 'Integration',
            entityId: integration.id
        }
    });
    return integration;
};
exports.disconnectIntegration = disconnectIntegration;
const testIntegration = async (id, actorId) => {
    const integration = await prisma_1.default.integration.findUnique({ where: { id } });
    if (!integration)
        throw new Error('NOT_FOUND');
    let success = false;
    let lastError = null;
    try {
        const secrets = JSON.parse((0, crypto_util_1.decryptSecret)(integration.credentials));
        if (!secrets)
            throw new Error('Invalid credentials format');
        if (integration.type === 'TWILIO') {
            const provider = new twilio_provider_1.TwilioProvider(secrets);
            success = await provider.testConnection();
        }
        else if (integration.type === 'MICROSOFT_365') {
            const provider = new microsoft365_provider_1.Microsoft365Provider(secrets);
            success = await provider.testConnection();
        }
        else if (integration.type === 'OPENAI') {
            const provider = new openai_provider_1.OpenAIProvider(secrets);
            success = await provider.testConnection();
        }
        else {
            throw new Error('Unsupported integration type');
        }
    }
    catch (err) {
        success = false;
        lastError = err.message || 'Unknown error';
    }
    const updated = await prisma_1.default.integration.update({
        where: { id },
        data: {
            status: success ? 'CONNECTED' : 'ERROR',
            lastTestedAt: new Date(),
            lastError
        }
    });
    await prisma_1.default.auditLog.create({
        data: {
            actorUserId: actorId,
            action: 'INTEGRATION_TEST',
            entityType: 'Integration',
            entityId: integration.id,
            metadataJson: JSON.stringify({ success, lastError })
        }
    });
    return updated;
};
exports.testIntegration = testIntegration;
