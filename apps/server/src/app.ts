import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import entityRoutes from './routes/entityRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import { authenticate } from './middleware/auth.js';
import { notFound, errorHandler } from './middleware/error.js';
import { reservationActions,roomActions,housekeepingActions,procurementActions,maintenanceActions,folioActions,posActions,incidentActions } from './routes/workflowRoutes.js';

export const app=express();
app.use(helmet());
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({limit:'2mb'}));
app.use(morgan(env.NODE_ENV==='production'?'combined':'dev'));
app.get('/api/health',(_req,res)=>res.json({status:'ok',service:'GrandStay Hotel ERP API',time:new Date().toISOString()}));
app.use('/api/auth',authRoutes);
app.use('/api',authenticate);
app.use('/api/admin',adminRoutes);
app.use('/api/dashboard',dashboardRoutes);
app.use('/api/audit-logs',auditRoutes);
app.use('/api/reservations',reservationActions);
app.use('/api/rooms',roomActions);
app.use('/api/housekeeping',housekeepingActions);
app.use('/api/procurement',procurementActions);
app.use('/api/maintenance',maintenanceActions);
app.use('/api/folios',folioActions);
app.use('/api/pos-orders',posActions);
app.use('/api/incidents',incidentActions);
app.use('/api',entityRoutes);
app.use(notFound);
app.use(errorHandler);
