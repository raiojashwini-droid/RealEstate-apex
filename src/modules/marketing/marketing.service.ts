import prisma from '../../prisma';
import { SocialChannel } from '@prisma/client';

export interface SocialCredentialUpdate {
  accountId?: string;
  accessToken?: string;
  pageId?: string;
  pageName?: string;
  webhookUrl?: string;
  isConnected?: boolean;
  lastTestedAt?: string | Date;
}

export const getSocialCredentials = async () => {
  const credentials = await prisma.socialCredential.findMany();
  return credentials;
};

export const updateSocialCredential = async (channel: SocialChannel, data: SocialCredentialUpdate) => {
  const existing = await prisma.socialCredential.findUnique({
    where: { channel }
  });

  if (existing) {
    return prisma.socialCredential.update({
      where: { channel },
      data: {
        accountId: data.accountId !== undefined ? data.accountId : existing.accountId,
        accessToken: data.accessToken !== undefined ? data.accessToken : existing.accessToken,
        pageId: data.pageId !== undefined ? data.pageId : existing.pageId,
        pageName: data.pageName !== undefined ? data.pageName : existing.pageName,
        webhookUrl: data.webhookUrl !== undefined ? data.webhookUrl : existing.webhookUrl,
        isConnected: data.isConnected !== undefined ? data.isConnected : existing.isConnected,
        lastTestedAt: data.lastTestedAt !== undefined ? new Date(data.lastTestedAt) : existing.lastTestedAt
      }
    });
  } else {
    return prisma.socialCredential.create({
      data: {
        channel,
        accountId: data.accountId ?? null,
        accessToken: data.accessToken ?? null,
        pageId: data.pageId ?? null,
        pageName: data.pageName ?? null,
        webhookUrl: data.webhookUrl ?? null,
        isConnected: data.isConnected ?? true,
        lastTestedAt: data.lastTestedAt ? new Date(data.lastTestedAt) : new Date()
      }
    });
  }
};

export interface MarketingPostData {
  content: string;
  channels?: string[];
}

export const createMarketingPost = async (data: MarketingPostData, userId: string) => {
  const channelString = Array.isArray(data.channels) ? data.channels.join(',') : '';
  
  return prisma.marketingPost.create({
    data: {
      content: data.content || '',
      channels: channelString,
      status: 'PUBLISHED',
      publishedAt: new Date(),
      createdBy: userId
    }
  });
};

export interface SmsBlastData {
  segment?: string;
  content?: string;
}

export const dispatchSmsBlast = async (data: SmsBlastData, userId: string) => {
  return prisma.marketingPost.create({
    data: {
      content: `[SMS BLAST] Segment: ${data.segment || 'Unknown'} - ${data.content || ''}`,
      channels: 'SMS',
      status: 'PUBLISHED',
      publishedAt: new Date(),
      createdBy: userId
    }
  });
};
