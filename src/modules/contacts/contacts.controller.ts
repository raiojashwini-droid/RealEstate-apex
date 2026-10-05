import { Request, Response, NextFunction } from 'express';
import * as contactsService from './contacts.service';

export const getContactsListHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await contactsService.getContactsList();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getContactByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = await contactsService.getContactById(id as string);
    if (!data) {
      return res.status(404).json({ success: false, error: { message: 'Contact not found' } });
    }
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const createContactHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const data = await contactsService.createContact(req.body, userId);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const updateContactHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = await contactsService.updateContact(id as string, req.body);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const deleteContactHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await contactsService.deleteContact(id as string);
    res.status(200).json({ success: true, message: 'Contact archived successfully' });
  } catch (error) {
    next(error);
  }
};

export const bulkCreateContactsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const { contacts } = req.body;
    if (!Array.isArray(contacts)) {
      return res.status(400).json({ success: false, error: { message: 'contacts array is required' } });
    }
    const data = await contactsService.bulkCreateContacts(contacts, userId);
    res.status(201).json({ success: true, data, count: data.length });
  } catch (error) {
    next(error);
  }
};

export const bulkDeleteContactsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: { message: 'ids array is required' } });
    }
    const data = await contactsService.bulkDeleteContacts(ids);
    res.status(200).json({ success: true, message: 'Contacts deleted successfully', data });
  } catch (error) {
    next(error);
  }
};

