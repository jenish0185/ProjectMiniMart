const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: /.+\@.+\..+/,
    },
    phoneNumber: {
      type: String,
    },
    password: {
      type: String,
    },
    profilePic: {
      type: String,
    },
    googleId: {
      type: String,
    },
    bio: {
      type: String,
      default: "No bio provided",
    },
    role: {
      type: String,
      enum: ["individual", "shelter", "admin"],
      required: true,
    },
    pets: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Pet",
      },
    ],
    adoptedPets: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Pet",
      },
    ],
    adoptionRequests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AdoptionRequest",
      },
    ],
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
    },
    verificationTokenExpiry: {
      type: Date,
    },
    verificationCode: {
      type: String,
    },
    verificationCodeExpires: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Export the User model
module.exports = mongoose.model("User", userSchema);