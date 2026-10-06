"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSystemSettings = exports.getSystemSettings = void 0;
const prisma_1 = __importDefault(require("../../prisma"));
const getSystemSettings = async () => {
    let settings = await prisma_1.default.systemSettings.findFirst();
    if (!settings) {
        settings = await prisma_1.default.systemSettings.create({
            data: {
                aiPersonaInstructions: 'You are an institutional acquisition bot...',
                aiConsecutiveReplyCap: 4,
                cadenceRetouchIntervalDays: 30,
                gradingWeightAddress: 35,
                gradingWeightPrice: 20
            }
        });
    }
    return settings;
};
exports.getSystemSettings = getSystemSettings;
const updateSystemSettings = async (data) => {
    const existing = await prisma_1.default.systemSettings.findFirst();
    if (!existing)
        return null;
    return prisma_1.default.systemSettings.update({
        where: { id: existing.id },
        data
    });
};
exports.updateSystemSettings = updateSystemSettings;
