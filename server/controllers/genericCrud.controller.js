const { asyncHandler } = require("../utils/asyncHandler");
const { sendResponse } = require("../utils/response");
const { getPagination } = require("../utils/pagination");

const makeCrud = (Model, name) => ({
  create: asyncHandler(async (req, res) => {
    const doc = await Model.create({ ...req.body, gymId: req.gymId });
    sendResponse(res, { status: 201, message: `${name} created`, data: doc });
  }),
  list: asyncHandler(async (req, res) => {
    const { skip, limit, page } = getPagination(req.query);
    const query = { gymId: req.gymId };
    if (req.query.search) query.name = new RegExp(req.query.search, "i");
    const [items, total] = await Promise.all([
      Model.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Model.countDocuments(query)
    ]);
    sendResponse(res, { message: `${name} list fetched`, data: { items, total, page, limit } });
  }),
  update: asyncHandler(async (req, res) => {
    const doc = await Model.findOneAndUpdate({ _id: req.params.id, gymId: req.gymId }, req.body, { new: true });
    sendResponse(res, { message: `${name} updated`, data: doc });
  }),
  remove: asyncHandler(async (req, res) => {
    await Model.findOneAndDelete({ _id: req.params.id, gymId: req.gymId });
    sendResponse(res, { message: `${name} deleted`, data: {} });
  })
});

module.exports = { makeCrud };
