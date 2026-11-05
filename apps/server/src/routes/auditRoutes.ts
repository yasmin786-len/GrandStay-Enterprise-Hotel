import { Router } from 'express';
import { authorize } from '../middleware/auth.js';
import { asyncHandler, sendPage } from '../utils/api.js';
import { AuditLog } from '../models/AuditLog.js';
import { scopeFilter } from '../services/scope.js';
const router=Router();
router.get('/',authorize('audit.read'),asyncHandler(async(req,res)=>{const page=Math.max(1,Number(req.query.page??1));const limit=Math.min(100,Number(req.query.limit??30));const filter=scopeFilter(req);const [data,total]=await Promise.all([AuditLog.find(filter).populate('userId','name email').sort({createdAt:-1}).skip((page-1)*limit).limit(limit).lean(),AuditLog.countDocuments(filter)]);sendPage(res,data,total,page,limit);}));
export default router;
