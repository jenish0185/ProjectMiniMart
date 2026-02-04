const mongoose = require("mongoose");

const petSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  breed: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ["Dog", "Cat"],
    required: true,
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
    required: true,
  },
  size: {
    type: String,
    enum: ["Small", "Medium", "Large"],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  isAdopted: {
    type: Boolean,
    default: false,
  },
  adoptionStatus: {
    type: String,
    enum: ["available", "pending", "adopted", "owned"],
    default: "available"
  },
  adoptionRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "AdoptionRequest",
  }],
  adoptedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  petPic: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },

  // Location
  location: {
    city: {
      type: String,
      required: true,
    },
    districtOrProvince: {
      type: String,
      required: true,
    },
    gpsCoordinates: {
      latitude: {
        type: Number,
        required: true,
      },
      longitude: {
        type: Number,
        required: true,
      },
    },
  },

  // Health Information
  healthInfo: {
    vaccinationStatus: {
      vaccinated: {
        type: Boolean,
        required: true,
      },
      vaccines: [{
        type: String,
      }],
    },
    neuteredOrSpayed: {
      type: Boolean,
      required: true,
    },
    medicalConditions: {
      type: [String],
      default: [],
    },
    lastVetVisit: {
      type: Date,
    },
    healthRecords: [{
      type: String, // URLs or references to files
    }],
    dewormed: {
      type: Boolean,
      required: true,
    },
  },

  // Behavioral Traits
  behavioralTraits: {
    goodWithChildren: {
      type: Boolean,
      required: true,
    },
    goodWithOtherPets: {
      type: Boolean,
      required: true,
    },
    temperament: {
      type: String,
      enum: ["Friendly", "Shy", "Aggressive", "Playful", "Calm"],
      required: true,
    },
    houseTrained: {
      type: Boolean,
      required: true,
    },
  },

  // Reason for Putting Up for Adoption
  reasonForAdoption: {
    type: String,
    required: true,
  },

  // Living Environment Preferences
  livingEnvironmentPreferences: {
    indoorOutdoor: {
      type: String,
      enum: ["Indoor", "Outdoor", "Both"],
      required: true,
    },
    spaceRequirement: {
      type: String,
      enum: ["Small", "Medium", "Large"],
      required: true,
    },
    activityLevel: {
      type: String,
      enum: ["Low", "Medium", "High"],
      required: true,
    },
  },

  // Media and Identity
  additionalPhotos: [{
    type: String, // Array of photo URLs
  }],

  petDocuments: [{
    type: String, // URLs for vaccination cards, licenses, etc.
  }],

  // Medical History
  medicalHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "MedicalRecord", // Reference to a separate collection for detailed records
  }],
});

const Pet = mongoose.model("Pet", petSchema);

module.exports = Pet;