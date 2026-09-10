// scripts/start_server.ts
import { bootstrap } from '../server.ts';
bootstrap().catch(err => console.error('Failed to start server:', err));

