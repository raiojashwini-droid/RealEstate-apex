"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTemplatesList = void 0;
const prisma_1 = __importDefault(require("../../prisma"));
const getTemplatesList = async () => {
    const templates = await prisma_1.default.outreachTemplate.findMany({
        orderBy: { touchNumber: 'asc' }
    });
    return templates.map(t => ({
        id: t.id,
        channel: t.channel.toLowerCase(),
        name: t.name,
        touchNumber: t.touchNumber,
        subject: t.subject,
        body: t.body,
        isActive: t.isActive,
        category: t.name.toLowerCase().includes('offer') ? 'deal_offers' : '5_touch_cadence',
        variables: ['first_name', 'market', 'property_address']
    }));
};
exports.getTemplatesList = getTemplatesList;
