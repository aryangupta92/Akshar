import { Router } from 'express';
import { searchContent } from '../controllers/searchController';

const router = Router();

router.get('/', searchContent);

export default router;
