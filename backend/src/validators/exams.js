const Joi = require('joi');

const listExamConfigsSchema = Joi.object({
  query: Joi.object({
    className: Joi.string().max(50)
  })
});

const updateExamConfigSchema = Joi.object({
  body: Joi.object({
    academicYear: Joi.object({
      preset: Joi.string().valid('jan-dec', 'apr-mar', 'sep-aug', 'custom'),
      startMonth: Joi.number().min(1).max(12)
    }),
    examTypes: Joi.object({
      monthly: Joi.object({
        enabled: Joi.boolean(),
        months: Joi.array().items(Joi.number().min(1).max(12))
      }),
      mid: Joi.object({
        enabled: Joi.boolean()
      }),
      final: Joi.object({
        enabled: Joi.boolean()
      })
    }),
    structure: Joi.object({
      subjectWiseMarks: Joi.boolean(),
      theoryPracticalSplit: Joi.boolean(),
      defaultMaxMarks: Joi.number().min(1).max(1000),
      defaultPassingMarks: Joi.number().min(0).max(1000),
      overallPassPercentage: Joi.number().min(0).max(100),
      gradingSystem: Joi.string().valid('marks', 'grades', 'hybrid'),
      weightage: Joi.object({
        monthly: Joi.number().min(0).max(100),
        mid: Joi.number().min(0).max(100),
        final: Joi.number().min(0).max(100)
      })
    }),
    visibility: Joi.object({
      studentVisibility: Joi.string().valid('beforeApproval', 'afterApproval'),
      parentVisible: Joi.boolean(),
      showSubjectMarks: Joi.boolean()
    }),
    applyToAllClasses: Joi.boolean()
  }).min(1)
});

const listExamsSchema = Joi.object({
  query: Joi.object({
    className: Joi.string().max(50),
    type: Joi.string().valid('monthly', 'mid', 'final', 'custom'),
    year: Joi.number(),
    month: Joi.number().min(1).max(12),
    status: Joi.string().valid('draft', 'open', 'locked', 'submitted', 'approved', 'published'),
    archived: Joi.string().valid('active', 'archived', 'all')
  })
});

const setupSummarySchema = Joi.object({
  query: Joi.object({
    type: Joi.string().valid('monthly', 'mid', 'final', 'custom').required(),
    year: Joi.number().required(),
    month: Joi.number().min(1).max(12)
  })
});

const bulkSetupSchema = Joi.object({
  body: Joi.object({
    type: Joi.string().valid('monthly', 'mid', 'final', 'custom').required(),
    year: Joi.number().required(),
    month: Joi.when('type', {
      is: 'monthly',
      then: Joi.number().min(1).max(12).required(),
      otherwise: Joi.number().min(1).max(12)
    }),
    name: Joi.string().max(120).allow(''),
    instructions: Joi.string().allow('')
  })
});

const createExamSchema = Joi.object({
  body: Joi.object({
    className: Joi.string().max(50).required(),
    type: Joi.string().valid('monthly', 'mid', 'final', 'custom').required(),
    name: Joi.string().max(100).required(),
    year: Joi.number().required(),
    month: Joi.when('type', {
      is: 'monthly',
      then: Joi.number().min(1).max(12).required(),
      otherwise: Joi.number().min(1).max(12)
    }),
    instructions: Joi.string().allow(''),
    academicYear: Joi.object({
      startMonth: Joi.number().min(1).max(12),
      endMonth: Joi.number().min(1).max(12),
      yearLabel: Joi.string().max(40).allow('')
    }),
    subjects: Joi.array().items(
      Joi.object({
        subject: Joi.string(),
        date: Joi.date(),
        startTime: Joi.string().max(20).allow(''),
        durationMinutes: Joi.number().min(1),
        maxMarks: Joi.number().min(1),
        passingMarks: Joi.number().min(0),
        theoryMax: Joi.number().min(0),
        practicalMax: Joi.number().min(0)
      })
    )
  })
});

const updateExamSchema = Joi.object({
  body: Joi.object({
    className: Joi.string().max(50),
    type: Joi.string().valid('monthly', 'mid', 'final', 'custom'),
    name: Joi.string().max(100),
    year: Joi.number(),
    month: Joi.number().min(1).max(12).allow(null, ''),
    instructions: Joi.string().allow(''),
<<<<<<< HEAD
    resultWeights: Joi.object({
      exam: Joi.number().min(0).max(100),
      attendance: Joi.number().min(0).max(100),
      homework: Joi.number().min(0).max(100),
      gr: Joi.number().min(0).max(100)
    }),
=======
>>>>>>> 840ff67df38f58f0f98a7d641b0485545e8e9854
    subjects: Joi.array().items(
      Joi.object({
        subject: Joi.string(),
        date: Joi.date(),
        startTime: Joi.string().max(20).allow(''),
        durationMinutes: Joi.number().min(1),
        maxMarks: Joi.number().min(1),
        passingMarks: Joi.number().min(0),
        theoryMax: Joi.number().min(0),
        practicalMax: Joi.number().min(0)
      })
    ),
    marksEntry: Joi.object({
      uploadOpensAt: Joi.date(),
      uploadClosesAt: Joi.date()
    })
  }).min(1)
});

const getExamSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().required()
  })
});

const hardDeleteExamSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().required()
  })
});

const teacherAssignmentsSchema = Joi.object({
  query: Joi.object({
    year: Joi.number()
  })
});

const getMarksSheetSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().required()
  }),
  query: Joi.object({
    subjectId: Joi.string().required(),
    section: Joi.string().max(10).allow('')
  })
});

const upsertMarksSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().required()
  }),
  query: Joi.object({
    subjectId: Joi.string().required(),
    section: Joi.string().max(10).allow('')
  }),
  body: Joi.object({
    rows: Joi.array().items(
      Joi.object({
        student: Joi.string().required(),
        marks: Joi.number().min(0).allow(null, ''),
        theoryMarks: Joi.number().min(0).allow(null, ''),
        practicalMarks: Joi.number().min(0).allow(null, '')
      })
    ).required()
  })
});

module.exports = {
  listExamConfigsSchema,
  updateExamConfigSchema,
  listExamsSchema,
  setupSummarySchema,
  bulkSetupSchema,
  createExamSchema,
  updateExamSchema,
  getExamSchema,
  hardDeleteExamSchema,
  teacherAssignmentsSchema,
  getMarksSheetSchema,
  upsertMarksSchema
};
