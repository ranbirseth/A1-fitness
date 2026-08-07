const router = require("express").Router();
const { protect, authorize } = require("../middlewares/auth.middleware");
const {
  createPayment,
  listPayments,
  getMyPayments,
  pendingDues,
  getInvoice,
  createOnlinePaymentIntent,
  confirmOnlinePayment,
  markAsPaid,
  markAsUnpaid
} = require("../controllers/payment.controller");

router.use(protect);
// Member route - must come before admin routes to avoid conflicts
router.get("/my-payments", authorize("member"), getMyPayments);
router.get("/", authorize("admin", "trainer"), listPayments);
router.get("/dues", authorize("admin", "trainer"), pendingDues);
router.get("/:id/invoice", authorize("admin", "trainer", "member"), getInvoice);
router.patch("/:id/paid", authorize("admin", "trainer"), markAsPaid);
router.patch("/:id/unpaid", authorize("admin", "trainer"), markAsUnpaid);
router.post("/", authorize("admin", "trainer"), createPayment);
router.post("/online/intent", authorize("admin", "trainer", "member"), createOnlinePaymentIntent);
router.post("/online/confirm", authorize("admin", "trainer", "member"), confirmOnlinePayment);

module.exports = router;
