// Fix route ordering: /my must come BEFORE /:id
import { Router } from 'express';
import {
  getContents,
  createContent,
  getMyContents,
  getContentById,
  updateContent,
  deleteContent,
  saveContentDelta,
  getContentVersions,
  toggleBookmark,
  rateContent,
} from '../controllers/contentController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

router.get('/my', protect, getMyContents);   // ← MUST be before /:id
router.get('/', getContents);
router.post('/', protect, createContent);

router.get('/:id', getContentById);
router.put('/:id', protect, updateContent);
router.delete('/:id', protect, deleteContent);
router.patch('/:id/save', protect, saveContentDelta);
router.get('/:id/versions', protect, getContentVersions);
router.post('/:id/bookmark', protect, toggleBookmark);
router.post('/:id/rate', protect, rateContent);

export default router;
