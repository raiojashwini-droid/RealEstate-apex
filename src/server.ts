import 'dotenv/config';
import app from './app';

const PORT = process.env.PORT || 5000;

const startServer = () => {
  app.listen(PORT, () => {
    console.log(`[Server]: API is running at http://localhost:${PORT}`);
  });
};

startServer();
