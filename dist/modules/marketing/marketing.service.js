"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dispatchSmsBlast = exports.createMarketingPost = exports.updateSocialCredential = exports.getSocialCredentials = void 0;
const prisma_1 = __importDefault(require("../../prisma"));
const getSocialCredentials = async () => {
    const credentials = await prisma_1.default.socialCredential.findMany();
    return credentials;
};
exports.getSocialCredentials = getSocialCredentials;
const updateSocialCredential = async (channel, data) => {
    const existing = await prisma_1.default.socialCredential.findUnique({
        where: { channel }
    });
    if (existing) {
        return prisma_1.default.socialCredential.update({
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
    }
    else {
        return prisma_1.default.socialCredential.create({
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
exports.updateSocialCredential = updateSocialCredential;
const createMarketingPost = async (data, userId) => {
    const channelString = Array.isArray(data.channels) ? data.channels.join(',') : '';
    return prisma_1.default.marketingPost.create({
        data: {
            content: data.content || '',
            channels: channelString,
            status: 'PUBLISHED',
            publishedAt: new Date(),
            createdBy: userId
        }
    });
};
exports.createMarketingPost = createMarketingPost;
const dispatchSmsBlast = async (data, userId) => {
    return prisma_1.default.marketingPost.create({
        data: {
            content: `[SMS BLAST] Segment: ${data.segment || 'Unknown'} - ${data.content || ''}`,
            channels: 'SMS',
            status: 'PUBLISHED',
            publishedAt: new Date(),
            createdBy: userId
        }
    });
};
exports.dispatchSmsBlast = dispatchSmsBlast;
