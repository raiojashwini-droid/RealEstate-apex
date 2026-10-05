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
exports.overrideGradeHandler = exports.updateConversationStatusHandler = exports.createMessageHandler = exports.getConversationsListHandler = void 0;
const conversationsService = __importStar(require("./conversations.service"));
const getConversationsListHandler = async (req, res, next) => {
    try {
        const data = await conversationsService.getConversationsList();
        res.status(200).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
};
exports.getConversationsListHandler = getConversationsListHandler;
const createMessageHandler = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { text, channel } = req.body;
        const userId = req.user?.id;
        if (!id || !text || typeof text !== 'string' || !text.trim()) {
            return res.status(400).json({
                success: false,
                error: { message: 'Conversation ID and message text are required' }
            });
        }
        const data = await conversationsService.createMessage(id, text.trim(), userId, channel);
        return res.status(201).json({ success: true, data });
    }
    catch (error) {
        if (error.message === 'CONVERSATION_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                error: { message: 'Conversation not found' }
            });
        }
        next(error);
    }
};
exports.createMessageHandler = createMessageHandler;
const updateConversationStatusHandler = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { aiStatus, status, reason } = req.body;
        const userId = req.user?.id;
        if (!id) {
            return res.status(400).json({
                success: false,
                error: { message: 'Conversation ID is required' }
            });
        }
        const targetStatus = aiStatus || status || 'Active';
        const data = await conversationsService.updateConversationStatus(id, targetStatus, userId, reason);
        return res.status(200).json({ success: true, data });
    }
    catch (error) {
        if (error.message === 'CONVERSATION_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                error: { message: 'Conversation not found' }
            });
        }
        next(error);
    }
};
exports.updateConversationStatusHandler = updateConversationStatusHandler;
const overrideGradeHandler = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { grade, score, reason } = req.body;
        const userId = req.user?.id;
        if (!id || !grade || score === undefined) {
            return res.status(400).json({
                success: false,
                error: { message: 'Conversation ID, grade, and score are required' }
            });
        }
        const data = await conversationsService.overrideGrade(id, grade, Number(score), reason || 'Manual grade override', userId);
        return res.status(200).json({ success: true, data });
    }
    catch (error) {
        if (error.message === 'CONVERSATION_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                error: { message: 'Conversation not found' }
            });
        }
        next(error);
    }
};
exports.overrideGradeHandler = overrideGradeHandler;
