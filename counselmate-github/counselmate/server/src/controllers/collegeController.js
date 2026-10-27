import { body } from 'express-validator';
import * as Colleges from '../models/College.js';
import { TYPES } from '../utils/sqlFilters.js';
import { asyncHandler, asString, asNumber, parseId, pick } from '../utils/helpers.js';

const FIELDS = ['name', 'city', 'state', 'type', 'courses', 'fees', 'cutoff', 'rating', 'established', 'website', 'description'];

export const collegeRules = [
  body('name').isString().trim().isLength({ min: 2, max: 120 }).withMessage('Name must be 2 to 120 characters.'),
  body('city').isString().trim().isLength({ min: 2, max: 60 }).withMessage('Enter a city.'),
  body('state').isString().trim().isLength({ min: 2, max: 60 }).withMessage('Enter a state.'),
  body('type').isIn(TYPES).withMessage('Type must be Government, Private or Autonomous.'),
  body('courses').isArray({ min: 1, max: 20 }).withMessage('Add at least one course.'),
  body('courses.*').isString().trim().isLength({ min: 2, max: 60 }).withMessage('Each course must be 2 to 60 characters.'),
  body('fees').isInt({ min: 0, max: 5000000 }).withMessage('Fees must be a whole number between 0 and 50,00,000.').toInt(),
  body('cutoff').isFloat({ min: 0, max: 100 }).withMessage('Cutoff must be between 0 and 100.').toFloat(),
  body('rating').optional({ values: 'falsy' }).isFloat({ min: 0, max: 5 }).withMessage('Rating must be between 0 and 5.').toFloat(),
  body('established').optional({ values: 'falsy' }).isInt({ min: 1800, max: 2100 }).withMessage('Enter a valid year.').toInt(),
  body('website').optional({ values: 'falsy' }).isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Website must start with http:// or https://').bail()
    .isLength({ max: 200 }).withMessage('Website link is too long.'),
  body('description').optional().isString().trim().isLength({ max: 5000 }).withMessage('Description is too long.'),
];

export const list = asyncHandler(async (req, res) => {
  const q = req.query;
  // every value is checked or turned into a plain string/number before it goes anywhere
  const filters = {
    search: asString(q.search, 60),
    city: asString(q.city, 60),
    state: asString(q.state, 60),
    type: asString(q.type, 20),
    course: asString(q.course, 60),
    maxFees: asNumber(q.maxFees) ?? undefined,
    minRating: asNumber(q.minRating) ?? undefined,
    maxCutoff: asNumber(q.maxCutoff) ?? undefined,
  };
  const limit = Math.min(Math.max(parseInt(asString(q.limit, 3), 10) || 12, 1), 24);
  const page = Math.max(parseInt(asString(q.page, 4), 10) || 1, 1);

  const { items, total } = await Colleges.list(filters, { sort: asString(q.sort, 20), page, limit });
  res.json({ items, total, page, pages: Math.max(Math.ceil(total / limit), 1) });
});

export const meta = asyncHandler(async (_req, res) => {
  res.json({ ...(await Colleges.meta()), types: TYPES });
});

export const getOne = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const college = id && (await Colleges.findById(id));
  if (!college) return res.status(404).json({ message: 'College not found.' });
  res.json({ college });
});

export const create = asyncHandler(async (req, res) => {
  const id = await Colleges.create(pick(req.body, FIELDS));      // only whitelisted fields
  res.status(201).json({ college: await Colleges.findById(id) });
});

export const update = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id || !(await Colleges.update(id, pick(req.body, FIELDS)))) {
    return res.status(404).json({ message: 'College not found.' });
  }
  res.json({ college: await Colleges.findById(id) });
});

export const remove = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id || !(await Colleges.remove(id))) return res.status(404).json({ message: 'College not found.' });
  res.json({ message: 'College deleted.' });
});
