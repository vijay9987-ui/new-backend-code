const express = require("express");
const router = express.Router();

const {
  createForm,
  submitForm,
  getForms,
  getFormById,
  getFormSubmissions,
  updateForm,
  deleteForm,
} = require("../controllers/formCreationController");

// Create a form
router.post("/create", createForm);

// Submit form data using API key
router.post("/submit/:apiKey", submitForm);

// Get all forms
router.get("/", getForms);

// Get form by ID
router.get("/:id", getFormById);

// Get all submissions of a form
router.get("/:id/submissions", getFormSubmissions);

// Update form
router.put("/:id", updateForm);

// Delete form
router.delete("/:id", deleteForm);

module.exports = router;