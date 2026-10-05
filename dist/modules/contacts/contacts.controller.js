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
exports.bulkDeleteContactsHandler = exports.bulkCreateContactsHandler = exports.deleteContactHandler = exports.updateContactHandler = exports.createContactHandler = exports.getContactByIdHandler = exports.getContactsListHandler = void 0;
const contactsService = __importStar(require("./contacts.service"));
const getContactsListHandler = async (req, res, next) => {
    try {
        const data = await contactsService.getContactsList();
        res.status(200).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
};
exports.getContactsListHandler = getContactsListHandler;
const getContactByIdHandler = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = await contactsService.getContactById(id);
        if (!data) {
            return res.status(404).json({ success: false, error: { message: 'Contact not found' } });
        }
        res.status(200).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
};
exports.getContactByIdHandler = getContactByIdHandler;
const createContactHandler = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const data = await contactsService.createContact(req.body, userId);
        res.status(201).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
};
exports.createContactHandler = createContactHandler;
const updateContactHandler = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = await contactsService.updateContact(id, req.body);
        res.status(200).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
};
exports.updateContactHandler = updateContactHandler;
const deleteContactHandler = async (req, res, next) => {
    try {
        const { id } = req.params;
        await contactsService.deleteContact(id);
        res.status(200).json({ success: true, message: 'Contact archived successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteContactHandler = deleteContactHandler;
const bulkCreateContactsHandler = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { contacts } = req.body;
        if (!Array.isArray(contacts)) {
            return res.status(400).json({ success: false, error: { message: 'contacts array is required' } });
        }
        const data = await contactsService.bulkCreateContacts(contacts, userId);
        res.status(201).json({ success: true, data, count: data.length });
    }
    catch (error) {
        next(error);
    }
};
exports.bulkCreateContactsHandler = bulkCreateContactsHandler;
const bulkDeleteContactsHandler = async (req, res, next) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, error: { message: 'ids array is required' } });
        }
        const data = await contactsService.bulkDeleteContacts(ids);
        res.status(200).json({ success: true, message: 'Contacts deleted successfully', data });
    }
    catch (error) {
        next(error);
    }
};
exports.bulkDeleteContactsHandler = bulkDeleteContactsHandler;
