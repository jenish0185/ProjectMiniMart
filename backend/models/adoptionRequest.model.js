// adoptionRequest.model.js
const mongoose = require("mongoose");

const adoptionRequestSchema = new mongoose.Schema({
  petId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Pet",
    required: true
  },
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true,
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  previousExperience: {
    type: String,
    required: false,
    trim: true
  },
  adoptionReason: {
    type: String,
    required: true,
    trim: true
  },
  adoptionStatus: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending"
  },
}, { timestamps: true });

module.exports = mongoose.model("AdoptionRequest", adoptionRequestSchema);