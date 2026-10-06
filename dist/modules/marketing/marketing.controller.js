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
exports.dispatchSmsBlast = exports.createMarketingPost = exports.updateSocialCredential = exports.getSocialCredentials = void 0;
const marketingService = __importStar(require("./marketing.service"));
const getSocialCredentials = async (req, res) => {
    try {
        const creds = await marketingService.getSocialCredentials();
        res.status(200).json({ success: true, data: creds });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { message: error.message } });
    }
};
exports.getSocialCredentials = getSocialCredentials;
const updateSocialCredential = async (req, res) => {
    try {
        const channelRaw = req.params.channel;
        if (!channelRaw || typeof channelRaw !== 'string') {
            res.status(400).json({ success: false, error: { message: 'Invalid channel' } });
            return;
        }
        const channel = channelRaw.toUpperCase();
        const updated = await marketingService.updateSocialCredential(channel, req.body);
        res.status(200).json({ success: true, data: updated });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { message: error.message } });
    }
};
exports.updateSocialCredential = updateSocialCredential;
const createMarketingPost = async (req, res) => {
    try {
        const post = await marketingService.createMarketingPost(req.body, req.user.id);
        res.status(201).json({ success: true, data: post });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { message: error.message } });
    }
};
exports.createMarketingPost = createMarketingPost;
const dispatchSmsBlast = async (req, res) => {
    try {
        const blast = await marketingService.dispatchSmsBlast(req.body, req.user.id);
        res.status(200).json({ success: true, data: blast });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { message: error.message } });
    }
};
exports.dispatchSmsBlast = dispatchSmsBlast;
