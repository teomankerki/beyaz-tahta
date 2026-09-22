import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';

function localBacklogApiPlugin(): Plugin {
  const dataDir = path.resolve(process.cwd(), 'data');
  const dataFilePath = path.resolve(dataDir, 'backlog.json');

  const ensureDataFile = () => {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  };

  const handleRequest = (req: any, res: any, next: any) => {
    // Only intercept /api/backlog routes
    if (req.url === '/api/backlog') {
      if (req.method === 'GET') {
        try {
          ensureDataFile();
          if (fs.existsSync(dataFilePath)) {
            const content = fs.readFileSync(dataFilePath, 'utf-8');
            res.setHeader('Content-Type', 'application/json');
            res.end(content);
            return;
          } else {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'No data file found' }));
            return;
          }
        } catch (err: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
          return;
        }
      }

      if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk: any) => {
          body += chunk;
        });
        req.on('end', () => {
          try {
            ensureDataFile();
            const parsed = JSON.parse(body);
            parsed.lastModified = new Date().toISOString();
            fs.writeFileSync(dataFilePath, JSON.stringify(parsed, null, 2), 'utf-8');
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, savedAt: parsed.lastModified }));
          } catch (err: any) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: err.message }));
          }
        });
        return;
      }
    }

    next();
  };

  return {
    name: 'local-backlog-api',
    configureServer(server) {
      server.middlewares.use(handleRequest);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handleRequest);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    localBacklogApiPlugin(),
  ],
});
