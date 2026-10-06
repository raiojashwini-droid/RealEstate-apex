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
exports.assignDealHandler = exports.bulkDeleteDealsHandler = exports.deleteDealHandler = exports.updateDealAnalysisHandler = exports.updateDealStageHandler = exports.createDealHandler = exports.getDealByIdHandler = exports.getDealsPipelineHandler = void 0;
const dealsService = __importStar(require("./deals.service"));
const getDealsPipelineHandler = async (req, res, next) => {
    try {
        const user = req.user;
        const data = await dealsService.getDealsPipeline(user);
        res.status(200).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
};
exports.getDealsPipelineHandler = getDealsPipelineHandler;
const getDealByIdHandler = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = await dealsService.getDealById(id);
        if (!data) {
            return res.status(404).json({ success: false, error: { message: 'Deal not found' } });
        }
        res.status(200).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
};
exports.getDealByIdHandler = getDealByIdHandler;
const createDealHandler = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const deal = await dealsService.createDeal(req.body, userId);
        res.status(201).json({ success: true, data: deal });
    }
    catch (error) {
        next(error);
    }
};
exports.createDealHandler = createDealHandler;
const updateDealStageHandler = async (req, res, next) => {
    try {
        const id = String(req.params.id);
        const stage = String(req.body.stage || '');
        const updated = await dealsService.updateDealStage(id, stage);
        res.status(200).json({ success: true, data: updated });
    }
    catch (error) {
        next(error);
    }
};
exports.updateDealStageHandler = updateDealStageHandler;
const updateDealAnalysisHandler = async (req, res, next) => {
    try {
        const id = String(req.params.id);
        const updated = await dealsService.updateDealAnalysis(id, req.body);
        res.status(200).json({ success: true, data: updated });
    }
    catch (error) {
        next(error);
    }
};
exports.updateDealAnalysisHandler = updateDealAnalysisHandler;
const deleteDealHandler = async (req, res, next) => {
    try {
        const id = String(req.params.id);
        await dealsService.deleteDeal(id);
        res.status(200).json({ success: true, message: 'Deal archived successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteDealHandler = deleteDealHandler;
const bulkDeleteDealsHandler = async (req, res, next) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, error: { message: 'ids array is required' } });
        }
        const data = await dealsService.bulkDeleteDeals(ids);
        res.status(200).json({ success: true, message: 'Deals deleted successfully', data });
    }
    catch (error) {
        next(error);
    }
};
exports.bulkDeleteDealsHandler = bulkDeleteDealsHandler;
const assignDealHandler = async (req, res, next) => {
    try {
        const id = String(req.params.id);
        const { ownerId } = req.body;
        const updated = await dealsService.assignDeal(id, ownerId);
        res.status(200).json({ success: true, data: updated });
    }
    catch (error) {
        next(error);
    }
};
exports.assignDealHandler = assignDealHandler;
