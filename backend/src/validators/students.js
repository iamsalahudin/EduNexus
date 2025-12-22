const Joi = require('joi');

const addParentSchema = Joi.object({
  body: Joi.object({
    parentId: Joi.string().required()
  })
});

const bulkImportSchema = Joi.object({
  body: Joi.object({
    students: Joi.array()
      .items(
        Joi.object({
          studentId: Joi.string().required(),
          firstName: Joi.string().required(),
          lastName: Joi.string(),
          class: Joi.string().required(),
          section: Joi.string(),
          dob: Joi.date(),
          parentEmail: Joi.string().email(),
          parentName: Joi.string()
        })
      )
      .min(1)
      .required()
  })
});

module.exports = { addParentSchema, bulkImportSchema };
