// routes/formRoutes.js
const express = require("express");
const router = express.Router();

const {
  createForm,
  getForms,
  getFormById,
  getFormByApiKey,
  getFormsByUser,
  updateForm,
  deleteForm,
  regenerateApiKey,
  cloneForm,
  searchForms,
  getFormStats,
} = require("../controllers/formCreationController");

const {
  submitForm,
  getFormSubmissions,
  getSubmissionById,
  updateSubmission,
  deleteSubmission,
  deleteAllSubmissions,
  getSubmissionStats,
  exportSubmissions,
} = require("../controllers/formSubmissionController");

// ================= FORM CRUD ROUTES =================
router.post("/", createForm); // Create form
router.get("/", getForms); // Get all forms
router.get("/search", searchForms); // Search forms
router.get("/:id", getFormById); // Get form by ID
router.get("/user/:userId", getFormsByUser); // Get forms by user
router.get("/apikey/:apiKey", getFormByApiKey); // Get form by API key (public)
router.put("/:id", updateForm); // Update form
router.put("/:id/regenerate-key", regenerateApiKey); // Regenerate API key
router.post("/:id/clone", cloneForm); // Clone form
router.get("/:id/stats", getFormStats); // Get form statistics
router.delete("/:id", deleteForm); // Delete form

// ================= FORM SUBMISSION ROUTES =================
router.post("/submit/:apiKey", submitForm); // Submit form (public)
router.get("/:id/submissions", getFormSubmissions); // Get all submissions
router.get("/:id/submissions/export", exportSubmissions); // Export submissions
router.get("/:id/submissions/stats", getSubmissionStats); // Get submission stats
router.get("/submissions/:submissionId", getSubmissionById); // Get single submission
router.put("/submissions/:submissionId", updateSubmission); // Update submission
router.delete("/submissions/:submissionId", deleteSubmission); // Delete submission
router.delete("/:id/submissions", deleteAllSubmissions); // Delete all submissions

module.exports = router;