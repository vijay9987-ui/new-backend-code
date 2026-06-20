// controllers/formController.js
const Form = require("../modals/Form");
const FormSubmission = require("../modals/FormSubmission");
const crypto = require("crypto");

// ================= CREATE FORM =================
const createForm = async (req, res) => {
  try {
    const { userId, formName, fields, settings } = req.body;

    // Validate required fields
    if (!userId || !formName || !fields) {
      return res.status(400).json({
        success: false,
        message: "userId, formName, and fields are required",
      });
    }

    // Validate fields
    if (!Array.isArray(fields) || fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Fields must be a non-empty array",
      });
    }

    const apiKey = crypto.randomBytes(16).toString("hex");

    const form = await Form.create({
      userId,
      formName,
      fields,
      apiKey,
      settings: settings || {},
    });

    res.status(201).json({
      success: true,
      message: "Form created successfully",
      data: form,
    });
  } catch (error) {
    console.error("Create Form Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

// ================= GET ALL FORMS =================
const getForms = async (req, res) => {
  try {
    const { page = 1, limit = 10, userId } = req.query;
    
    const query = {};
    if (userId) query.userId = userId;

    const forms = await Form.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Form.countDocuments(query);

    res.status(200).json({
      success: true,
      data: forms,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get Forms Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= GET FORM BY ID =================
const getFormById = async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);

    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Form not found",
      });
    }

    res.status(200).json({
      success: true,
      data: form,
    });
  } catch (error) {
    console.error("Get Form By ID Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= GET FORM BY API KEY =================
const getFormByApiKey = async (req, res) => {
  try {
    const { apiKey } = req.params;
    
    const form = await Form.findOne({ apiKey });

    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Form not found",
      });
    }

    // Only return public form data
    res.status(200).json({
      success: true,
      data: {
        id: form._id,
        formName: form.formName,
        fields: form.fields,
        settings: form.settings,
      },
    });
  } catch (error) {
    console.error("Get Form By API Key Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= GET FORMS BY USER =================
const getFormsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const forms = await Form.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Form.countDocuments({ userId });

    res.status(200).json({
      success: true,
      data: forms,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get Forms By User Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= UPDATE FORM =================
const updateForm = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Prevent updating apiKey directly
    delete updateData.apiKey;

    const form = await Form.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Form not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Form updated successfully",
      data: form,
    });
  } catch (error) {
    console.error("Update Form Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= DELETE FORM =================
const deleteForm = async (req, res) => {
  try {
    const form = await Form.findByIdAndDelete(req.params.id);

    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Form not found",
      });
    }

    // Delete all related submissions
    const result = await FormSubmission.deleteMany({
      formId: req.params.id,
    });

    res.status(200).json({
      success: true,
      message: `Form deleted successfully. ${result.deletedCount} submissions removed.`,
    });
  } catch (error) {
    console.error("Delete Form Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= REGENERATE API KEY =================
const regenerateApiKey = async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);

    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Form not found",
      });
    }

    const newApiKey = crypto.randomBytes(16).toString("hex");
    form.apiKey = newApiKey;
    await form.save();

    res.status(200).json({
      success: true,
      message: "API key regenerated successfully",
      data: { apiKey: newApiKey },
    });
  } catch (error) {
    console.error("Regenerate API Key Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= CLONE FORM =================
const cloneForm = async (req, res) => {
  try {
    const originalForm = await Form.findById(req.params.id);

    if (!originalForm) {
      return res.status(404).json({
        success: false,
        message: "Form not found",
      });
    }

    const newApiKey = crypto.randomBytes(16).toString("hex");
    
    const clonedForm = await Form.create({
      userId: originalForm.userId,
      formName: `${originalForm.formName} (Copy)`,
      fields: JSON.parse(JSON.stringify(originalForm.fields)),
      apiKey: newApiKey,
      settings: originalForm.settings,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: "Form cloned successfully",
      data: clonedForm,
    });
  } catch (error) {
    console.error("Clone Form Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= SEARCH FORMS =================
const searchForms = async (req, res) => {
  try {
    const { query, userId } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const searchQuery = {
      $or: [
        { formName: { $regex: query, $options: 'i' } },
        { 'fields.label': { $regex: query, $options: 'i' } },
        { 'fields.name': { $regex: query, $options: 'i' } },
      ]
    };

    if (userId) {
      searchQuery.userId = userId;
    }

    const forms = await Form.find(searchQuery).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: forms.length,
      data: forms,
    });
  } catch (error) {
    console.error("Search Forms Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= GET FORM STATISTICS =================
const getFormStats = async (req, res) => {
  try {
    const { id } = req.params;
    const form = await Form.findById(id);

    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Form not found",
      });
    }

    const totalSubmissions = await FormSubmission.countDocuments({ formId: id });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaySubmissions = await FormSubmission.countDocuments({
      formId: id,
      createdAt: { $gte: today },
    });

    const submissionsByStatus = await FormSubmission.aggregate([
      { $match: { formId: new mongoose.Types.ObjectId(id) } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const recentSubmissions = await FormSubmission.find({ formId: id })
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        totalSubmissions,
        todaySubmissions,
        submissionsByStatus,
        recentSubmissions,
        formInfo: {
          formName: form.formName,
          fieldsCount: form.fields.length,
          isActive: form.isActive,
        },
      },
    });
  } catch (error) {
    console.error("Get Form Stats Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
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
};