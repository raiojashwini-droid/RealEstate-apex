"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = void 0;
const errorMiddleware = (err, req, res, next) => {
    console.error(err);
    const statusCode = err.status || 500;
    const errorResponse = {
        success: false,
        error: {
            code: err.code || 'INTERNAL_ERROR',
            message: err.message || 'An unexpected error occurred',
        },
        meta: {
            requestId: req.requestId || 'unknown'
        }
    };
    res.status(statusCode).json(errorResponse);
};
exports.errorMiddleware = errorMiddleware;
