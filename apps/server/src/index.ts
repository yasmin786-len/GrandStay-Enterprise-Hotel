import { app } from './app.js';
import { connectDatabase } from './config/db.js';
import { env } from './config/env.js';

connectDatabase().then(()=>app.listen(env.PORT,()=>console.log(`GrandStay Hotel ERP API running on http://localhost:${env.PORT}`))).catch(error=>{console.error('Startup failed',error);process.exit(1);});
