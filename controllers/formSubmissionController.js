// controllers/submissionController.js
const Form = require("../modals/Form");
const FormSubmission = require("../modals/FormSubmission");

// ================= SUBMIT FORM =================
const submitForm = async (req, res) => {
  try {
    const { apiKey } = req.params;

    const form = await Form.findOne({ apiKey, isActive: true });

    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Invalid API Key or form is inactive",
      });
    }

    // Validate required fields
    const validationErrors = [];
    const submittedData = req.body;

    form.fields.forEach(field => {
      if (field.required) {
        const value = submittedData[field.name];
        if (value === undefined || value === null || value === "") {
          validationErrors.push(`${field.label} is required`);
        }
        
        // Additional validation based on field type
        if (field.type === 'email' && value) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            validationErrors.push(`${field.label} must be a valid email`);
          }
        }
        
        if (field.type === 'number' && value) {
          const num = Number(value);
          if (isNaN(num)) {
            validationErrors.push(`${field.label} must be a number`);
          }
          if (field.validation) {
            if (field.validation.min !== undefined && num < field.validation.min) {
              validationErrors.push(`${field.label} must be at least ${field.validation.min}`);
            }
            if (field.validation.max !== undefined && num > field.validation.max) {
              validationErrors.push(`${field.label} must be at most ${field.validation.max}`);
            }
          }
        }
      }
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    // Check for duplicate submissions if not allowed
    if (!form.settings?.allowMultipleSubmissions) {
      const existingSubmission = await FormSubmission.findOne({
        formId: form._id,
        "data.email": submittedData.email, // Assuming email is used for uniqueness
      });

      if (existingSubmission) {
        return res.status(409).json({
          success: false,
          message: "You have already submitted this form",
        });
      }
    }

    // Save submission
    const submission = await FormSubmission.create({
      formId: form._id,
      data: submittedData,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      metadata: {
        submittedAt: new Date(),
        source: req.headers['referer'] || 'direct',
      },
    });

    res.status(201).json({
      success: true,
      message: form.settings?.confirmationMessage || "Form submitted successfully",
      data: submission,
    });
  } catch (error) {
    console.error("Submit Form Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= GET ALL SUBMISSIONS FOR A FORM =================
const getFormSubmissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    const query = { formId: id };
    if (status) query.status = status;

    const submissions = await FormSubmission.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('formId', 'formName apiKey');

    const total = await FormSubmission.countDocuments(query);

    res.status(200).json({
      success: true,
      data: submissions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get Form Submissions Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= GET SUBMISSION BY ID =================
const getSubmissionById = async (req, res) => {
  try {
    const { submissionId } = req.params;

    const submission = await FormSubmission.findById(submissionId)
      .populate('formId', 'formName fields apiKey');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    res.status(200).json({
      success: true,
      data: submission,
    });
  } catch (error) {
    console.error("Get Submission By ID Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= UPDATE SUBMISSION =================
const updateSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const updateData = req.body;

    // Find submission first
    const submission = await FormSubmission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    // Verify associated form exists
    const form = await Form.findById(submission.formId);
    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Associated form not found",
      });
    }

    // Validate required fields if updating data
    if (updateData.data) {
      const validationErrors = [];
      form.fields.forEach(field => {
        if (field.required && !updateData.data[field.name]) {
          validationErrors.push(`${field.label} is required`);
        }
      });

      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validationErrors,
        });
      }
    }

    // Update submission
    if (updateData.data) {
      submission.data = updateData.data;
    }
    if (updateData.status) {
      submission.status = updateData.status;
    }
    await submission.save();

    res.status(200).json({
      success: true,
      message: "Submission updated successfully",
      data: submission,
    });
  } catch (error) {
    console.error("Update Submission Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= DELETE SUBMISSION =================
const deleteSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;

    const submission = await FormSubmission.findByIdAndDelete(submissionId);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Submission deleted successfully",
    });
  } catch (error) {
    console.error("Delete Submission Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= DELETE ALL SUBMISSIONS FOR A FORM =================
const deleteAllSubmissions = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await FormSubmission.deleteMany({
      formId: id,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "No submissions found for this form",
      });
    }

    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} submissions successfully`,
    });
  } catch (error) {
    console.error("Delete All Submissions Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= GET SUBMISSION STATISTICS =================
const getSubmissionStats = async (req, res) => {
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
    
    // Submissions by date (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyStats = await FormSubmission.aggregate([
      {
        $match: {
          formId: new mongoose.Types.ObjectId(id),
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
      },
    ]);

    // Submissions by status
    const statusStats = await FormSubmission.aggregate([
      { $match: { formId: new mongoose.Types.ObjectId(id) } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Recent submissions
    const recentSubmissions = await FormSubmission.find({ formId: id })
      .sort({ createdAt: -1 })
      .limit(5);

    // Field-wise data (most common values)
    const fieldData = {};
    const submissions = await FormSubmission.find({ formId: id });
    
    if (submissions.length > 0) {
      form.fields.forEach(field => {
        const values = submissions
          .map(s => s.data[field.name])
          .filter(v => v !== undefined && v !== null && v !== "");
        
        if (values.length > 0) {
          // Get most common value
          const frequency = {};
          let maxCount = 0;
          let mostCommon = values[0];
          
          values.forEach(val => {
            const key = String(val);
            frequency[key] = (frequency[key] || 0) + 1;
            if (frequency[key] > maxCount) {
              maxCount = frequency[key];
              mostCommon = val;
            }
          });
          
          fieldData[field.name] = {
            total: values.length,
            unique: new Set(values.map(v => String(v))).size,
            mostCommon: mostCommon,
            frequency: frequency,
          };
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        totalSubmissions,
        dailyStats: dailyStats.map(d => ({
          date: `${d._id.year}-${String(d._id.month).padStart(2, '0')}-${String(d._id.day).padStart(2, '0')}`,
          count: d.count,
        })),
        statusStats: statusStats.map(s => ({
          status: s._id || 'unknown',
          count: s.count,
        })),
        fieldData,
        recentSubmissions,
      },
    });
  } catch (error) {
    console.error("Get Submission Stats Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= EXPORT SUBMISSION DATA =================
const exportSubmissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'json' } = req.query;

    const submissions = await FormSubmission.find({ formId: id })
      .sort({ createdAt: -1 });

    if (submissions.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No submissions found for this form",
      });
    }

    if (format === 'csv') {
      // Get all field names from submissions
      const allFields = new Set();
      submissions.forEach(sub => {
        Object.keys(sub.data).forEach(key => allFields.add(key));
      });
      
      const headers = Array.from(allFields);
      const csvRows = [
        ['Submission ID', 'Created At', ...headers, 'Status'].join(',')
      ];

      submissions.forEach(sub => {
        const row = [
          sub._id,
          sub.createdAt.toISOString(),
          ...headers.map(header => JSON.stringify(sub.data[header] || '')),
          sub.status,
        ];
        csvRows.push(row.join(','));
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=submissions-${id}.csv`);
      return res.status(200).send(csvRows.join('\n'));
    }

    // Default: JSON
    res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions,
    });
  } catch (error) {
    console.error("Export Submissions Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  submitForm,
  getFormSubmissions,
  getSubmissionById,
  updateSubmission,
  deleteSubmission,
  deleteAllSubmissions,
  getSubmissionStats,
  exportSubmissions,
};