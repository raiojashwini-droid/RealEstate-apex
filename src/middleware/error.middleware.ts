import { Request, Response, NextFunction } from 'express';

export const errorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);

  const statusCode = err.status || 500;
  const errorResponse = {
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'An unexpected error occurred',
    },
    meta: {
      requestId: (req as any).requestId || 'unknown'
    }
  };

  res.status(statusCode).json(errorResponse);
};
