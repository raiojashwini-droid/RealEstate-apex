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
exports.deleteTaskHandler = exports.updateTaskHandler = exports.createTaskHandler = exports.getTasksListHandler = void 0;
const tasksService = __importStar(require("./tasks.service"));
const getTasksListHandler = async (req, res, next) => {
    try {
        const user = req.user;
        const assignedToId = req.query.assignedToId;
        const data = await tasksService.getTasksList(user?.id, user?.role, assignedToId);
        res.status(200).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
};
exports.getTasksListHandler = getTasksListHandler;
const createTaskHandler = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const data = await tasksService.createTask(req.body, userId);
        res.status(201).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
};
exports.createTaskHandler = createTaskHandler;
const updateTaskHandler = async (req, res, next) => {
    try {
        const user = req.user;
        const isOnlyStatusUpdate = Object.keys(req.body).length === 1 && req.body.status !== undefined;
        if (user?.role !== 'ADMIN' && !isOnlyStatusUpdate) {
            return res.status(403).json({ success: false, message: 'Forbidden: Only Admin can edit task details' });
        }
        const id = req.params.id;
        const data = await tasksService.updateTask(id, req.body);
        res.status(200).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
};
exports.updateTaskHandler = updateTaskHandler;
const deleteTaskHandler = async (req, res, next) => {
    try {
        const user = req.user;
        if (user?.role !== 'ADMIN') {
            return res.status(403).json({ success: false, message: 'Forbidden: Only Admin can delete tasks' });
        }
        const id = req.params.id;
        const data = await tasksService.deleteTask(id);
        res.status(200).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteTaskHandler = deleteTaskHandler;
