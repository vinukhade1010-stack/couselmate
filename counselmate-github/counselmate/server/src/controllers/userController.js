import * as Colleges from '../models/College.js';
import * as Guidance from '../models/Guidance.js';
import { getShortlistIds } from '../models/User.js';
import { asyncHandler, parseId } from '../utils/helpers.js';

const MAX_SHORTLIST = 30;

export const getShortlist = asyncHandler(async (req, res) => {
  res.json({ colleges: await Colleges.shortlistFor(req.user.id) });
});

/** Adds the college if it is not saved yet, removes it if it is. */
export const toggleShortlist = asyncHandler(async (req, res) => {
  const collegeId = parseId(req.params.collegeId);
  if (!collegeId || !(await Colleges.exists(collegeId))) {
    return res.status(404).json({ message: 'College not found.' });
  }
  const current = await getShortlistIds(req.user.id);
  if (!current.includes(collegeId) && current.length >= MAX_SHORTLIST) {
    return res.status(400).json({ message: `You can save up to ${MAX_SHORTLIST} colleges. Remove one first.` });
  }
  const shortlisted = await Colleges.toggleShortlist(req.user.id, collegeId);
  res.json({ shortlisted, ids: await getShortlistIds(req.user.id) });
});

export const getGuidance = asyncHandler(async (_req, res) => {
  res.json({ items: await Guidance.all() });
});
