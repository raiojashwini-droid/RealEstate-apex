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
exports.changeRoleHandler = exports.createUserHandler = exports.listUsersHandler = void 0;
const usersService = __importStar(require("./users.service"));
const listUsersHandler = async (req, res, next) => {
    try {
        const users = await usersService.getUsers();
        res.status(200).json({ success: true, data: users });
    }
    catch (err) {
        next(err);
    }
};
exports.listUsersHandler = listUsersHandler;
const createUserHandler = async (req, res, next) => {
    try {
        const actorId = req.user.id;
        const user = await usersService.createUser(req.body, actorId);
        res.status(201).json({ success: true, data: user });
    }
    catch (err) {
        if (err.message === 'EMAIL_EXISTS') {
            return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'Email already exists' } });
        }
        next(err);
    }
};
exports.createUserHandler = createUserHandler;
const changeRoleHandler = async (req, res, next) => {
    try {
        const actorId = req.user.id;
        const user = await usersService.updateUserRole(req.params.id, req.body.role, actorId);
        res.status(200).json({ success: true, data: user });
    }
    catch (err) {
        next(err);
    }
};
exports.changeRoleHandler = changeRoleHandler;
