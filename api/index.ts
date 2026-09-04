import app from '../frontend/server.ts';

export default function handler(req: any, res: any) {
  return app(req, res);
}
