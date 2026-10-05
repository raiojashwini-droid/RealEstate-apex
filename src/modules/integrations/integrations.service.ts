import prisma from '../../prisma';
import { encryptSecret, decryptSecret } from '../../utils/crypto.util';
import { TwilioProvider } from '../../services/integrations/twilio.provider';
import { Microsoft365Provider } from '../../services/integrations/microsoft365.provider';
import { OpenAIProvider } from '../../services/integrations/openai.provider';

export const getIntegrations = async () => {
  const integrations = await prisma.integration.findMany();
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

export const createOrUpdateIntegration = async (data: any, actorId: string) => {
  const { type, name, secrets, config } = data;
  
  const encryptedCredentials = encryptSecret(JSON.stringify(secrets));
  const configString = config ? JSON.stringify(config) : null;

  const existing = await prisma.integration.findFirst({ where: { type } });

  let integration;
  if (existing) {
    integration = await prisma.integration.update({
      where: { id: existing.id },
      data: {
        name: name || existing.name,
        credentials: encryptedCredentials,
        config: configString,
        updatedById: actorId,
      }
    });
  } else {
    integration = await prisma.integration.create({
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

  await prisma.auditLog.create({
    data: {
      actorUserId: actorId,
      action: existing ? 'INTEGRATION_UPDATE' : 'INTEGRATION_CONNECT',
      entityType: 'Integration',
      entityId: integration.id
    }
  });

  return { id: integration.id, status: integration.status };
};

export const disconnectIntegration = async (id: string, actorId: string) => {
  const integration = await prisma.integration.update({
    where: { id },
    data: {
      status: 'DISCONNECTED',
      updatedById: actorId
    }
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: actorId,
      action: 'INTEGRATION_DISCONNECT',
      entityType: 'Integration',
      entityId: integration.id
    }
  });

  return integration;
};

export const testIntegration = async (id: string, actorId: string) => {
  const integration = await prisma.integration.findUnique({ where: { id } });
  if (!integration) throw new Error('NOT_FOUND');

  let success = false;
  let lastError = null;

  try {
    const secrets = JSON.parse(decryptSecret(integration.credentials));
    if (!secrets) throw new Error('Invalid credentials format');
    
    if (integration.type === 'TWILIO') {
      const provider = new TwilioProvider(secrets);
      success = await provider.testConnection();
    } else if (integration.type === 'MICROSOFT_365') {
      const provider = new Microsoft365Provider(secrets);
      success = await provider.testConnection();
    } else if (integration.type === 'OPENAI') {
      const provider = new OpenAIProvider(secrets);
      success = await provider.testConnection();
    } else {
      throw new Error('Unsupported integration type');
    }
  } catch (err: any) {
    success = false;
    lastError = err.message || 'Unknown error';
  }

  const updated = await prisma.integration.update({
    where: { id },
    data: {
      status: success ? 'CONNECTED' : 'ERROR',
      lastTestedAt: new Date(),
      lastError
    }
  });

  await prisma.auditLog.create({
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
