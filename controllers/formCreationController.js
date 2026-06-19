const Form = require("../modals/Form");
const FormSubmission = require("../modals/FormSubmission");
const crypto = require("crypto");


// ================= Create Form =================
const createForm = async (req, res) => {
  try {
    const { userId, formName, fields } = req.body;

    console.log("Received form creation request:", req.body); // Log the request body for debugging

    const apiKey = crypto.randomBytes(16).toString("hex");
    console.log("Generated API Key:", apiKey); // Log the generated API key for debugging

    console.log("Schema:", Form.schema.obj);
console.log("Model name:", Form.modelName);

    const form = await Form.create({
      userId,
      formName,
      fields,
      apiKey,
    });
    console.log("Form created:", form); // Log the created form for debugging

    res.status(201).json({
      success: true,
      message: "Form created successfully",
      data: form,
    });
  } catch (error) {
  console.log(error);

  res.status(500).json({
    success: false,
    message: error.message,
    error
  });
}
}


// ================= Submit Form =================
const submitForm = async (req, res) => {
  try {
    const { apiKey } = req.params;

    const form = await Form.findOne({ apiKey });

    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Invalid API Key",
      });
    }

    // Save dynamic form data
    const submission = await FormSubmission.create({
      formId: form._id,
      data: req.body,
    });

    res.status(201).json({
      success: true,
      message: "Form submitted successfully",
      data: submission,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ================= Get All Forms =================
const getForms = async (req, res) => {
  try {
    const forms = await Form.find();

    res.status(200).json({
      success: true,
      count: forms.length,
      data: forms,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ================= Get Form By ID =================
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
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ================= Get Form Submissions =================
const getFormSubmissions = async (req, res) => {
  try {
    const submissions = await FormSubmission.find({
      formId: req.params.id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ================= Update Form =================
const updateForm = async (req, res) => {
  try {
    const form = await Form.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
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
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ================= Delete Form =================
const deleteForm = async (req, res) => {
  try {
    const form = await Form.findByIdAndDelete(req.params.id);

    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Form not found",
      });
    }

    // Delete related submissions
    await FormSubmission.deleteMany({
      formId: req.params.id,
    });

    res.status(200).json({
      success: true,
      message: "Form deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createForm,
  submitForm,
  getForms,
  getFormById,
  getFormSubmissions,
  updateForm,
  deleteForm,
};