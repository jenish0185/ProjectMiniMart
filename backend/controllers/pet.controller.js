const mongoose = require("mongoose");
const Pet = require("../models/pet.model");
const User = require("../models/user.model");

// Valid values for gender, size, and type
const validGenders = ["Male", "Female", "Other"];
const validSizes = ["Small", "Medium", "Large"];
const validTypes = ["Dog", "Cat"]; // Updated to only include "Dog" and "Cat"
const validAdoptionStatuses = ["available", "pending", "adopted", "owned"];

// Get All Pets (with filters)
const getAllPets = async (req, res) => {
  try {
    const { search, type, breed, age, size, gender, adoptionStatus } = req.query;
    const userId = req.user?._id; // Get the logged-in user's ID (if authenticated)

    let filter = {};
    filter.adoptionStatus = { $ne: "adopted" };

    if (userId) {
      filter.owner = { $ne: userId }; // Exclude owner's own pets
    }

    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [
        { name: regex },
        { breed: regex },
        { type: regex },
      ];
    }

    if (type && type !== "all") {
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: `Invalid type. Allowed values are: ${validTypes.join(", ")}`,
        });
      }
      filter.type = type;
    }

    if (breed && breed !== "all") filter.breed = breed;

    if (age && age !== "all") {
      let ageRange;
      switch (age) {
        case "0-1": ageRange = { $gte: 0, $lte: 1 }; break;
        case "1-3": ageRange = { $gte: 1, $lte: 3 }; break;
        case "4-6": ageRange = { $gte: 4, $lte: 6 }; break;
        case "7-9": ageRange = { $gte: 7, $lte: 9 }; break;
        case "10+": ageRange = { $gte: 10 }; break;
        default: ageRange = {};
      }
      filter.age = ageRange;
    }

    if (size && size !== "all") filter.size = size;
    if (gender && gender !== "all") filter.gender = gender;
    if (adoptionStatus && adoptionStatus !== "all") filter.adoptionStatus = adoptionStatus;

    const pets = await Pet.find(filter).populate("owner", "name email").lean();
    res.status(200).json({ success: true, pets });
  } catch (err) {
    console.error("Error fetching pets:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Add Pet for Adoption
const addPet = async (req, res) => {
  const { userId } = req.params;
  const {
    name,
    breed,
    age,
    gender,
    size,
    description,
    type,
    petPic,
    location,
    healthInfo,
    behavioralTraits,
    reasonForAdoption,
    livingEnvironmentPreferences,
    additionalPhotos,
    petDocuments,
    adoptionStatus, // Optional field
  } = req.body;

  // Validate required fields
  if (!name || !type || !breed || !age || !gender || !size || !petPic) {
    return res.status(400).json({
      success: false,
      message: "All required fields (name, type, breed, age, gender, size, petPic) are missing",
    });
  }

  if (!validGenders.includes(gender)) {
    return res.status(400).json({
      success: false,
      message: `Invalid gender. Allowed values are: ${validGenders.join(", ")}`,
    });
  }

  if (!validSizes.includes(size)) {
    return res.status(400).json({
      success: false,
      message: `Invalid size. Allowed values are: ${validSizes.join(", ")}`,
    });
  }

  if (!validTypes.includes(type)) {
    return res.status(400).json({
      success: false,
      message: `Invalid type. Allowed values are: ${validTypes.join(", ")}`,
    });
  }

  // Validate adoptionStatus (optional)
  if (adoptionStatus && !validAdoptionStatuses.includes(adoptionStatus)) {
    return res.status(400).json({
      success: false,
      message: `Invalid adoption status. Allowed values are: ${validAdoptionStatuses.join(", ")}`,
    });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const newPet = new Pet({
      name,
      breed,
      age,
      gender,
      size,
      description,
      type,
      petPic,
      location,
      healthInfo,
      behavioralTraits,
      reasonForAdoption,
      livingEnvironmentPreferences,
      additionalPhotos,
      petDocuments,
      owner: userId,
      adoptionStatus: adoptionStatus || "available", // Default to "available" if not provided
    });

    await newPet.save();
    user.pets.push(newPet._id);
    await user.save();

    res.status(201).json({
      success: true,
      message: "Pet added successfully",
      pet: newPet,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update Pet Information
const updatePet = async (req, res) => {
  const { petId } = req.params;
  const {
    name,
    breed,
    age,
    gender,
    size,
    description,
    petPic,
    location,
    healthInfo,
    behavioralTraits,
    reasonForAdoption,
    livingEnvironmentPreferences,
    additionalPhotos,
    petDocuments,
    adoptionStatus,
    type,
  } = req.body;

  if (gender && !validGenders.includes(gender)) {
    return res.status(400).json({
      success: false,
      message: `Invalid gender. Allowed values are: ${validGenders.join(", ")}`,
    });
  }

  if (size && !validSizes.includes(size)) {
    return res.status(400).json({
      success: false,
      message: `Invalid size. Allowed values are: ${validSizes.join(", ")}`,
    });
  }

  // Validate type if provided
  if (type && !validTypes.includes(type)) {
    return res.status(400).json({
      success: false,
      message: `Invalid type. Allowed values are: ${validTypes.join(", ")}`,
    });
  }

  // Validate adoptionStatus (optional)
  if (adoptionStatus && !validAdoptionStatuses.includes(adoptionStatus)) {
    return res.status(400).json({
      success: false,
      message: `Invalid adoption status. Allowed values are: ${validAdoptionStatuses.join(", ")}`,
    });
  }

  try {
    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({ success: false, message: "Pet not found" });
    }

    // Update pet details
    pet.name = name || pet.name;
    pet.breed = breed || pet.breed;
    pet.age = age || pet.age;
    pet.gender = gender || pet.gender;
    pet.size = size || pet.size;
    pet.description = description || pet.description;
    pet.petPic = petPic || pet.petPic;
    pet.location = location || pet.location;
    pet.healthInfo = healthInfo || pet.healthInfo;
    pet.behavioralTraits = behavioralTraits || pet.behavioralTraits;
    pet.reasonForAdoption = reasonForAdoption || pet.reasonForAdoption;
    pet.livingEnvironmentPreferences = livingEnvironmentPreferences || pet.livingEnvironmentPreferences;
    pet.additionalPhotos = additionalPhotos || pet.additionalPhotos;
    pet.petDocuments = petDocuments || pet.petDocuments;
    pet.type = type || pet.type; // Only update if explicitly provided
    pet.adoptionStatus = adoptionStatus || pet.adoptionStatus; // Only update if explicitly provided

    await pet.save();

    res.status(200).json({
      success: true,
      message: "Pet updated successfully",
      pet,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// View Pets for Adoption
const viewPetsForAdoption = async (req, res) => {
  try {
    const pets = await Pet.find({ adoptionStatus: "available" }).populate("owner", "name email").lean();
    res.status(200).json({ success: true, pets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Adopt a Pet
const adoptPet = async (req, res) => {
  const { userId, petId } = req.params;

  try {
    const user = await User.findById(userId);
    const pet = await Pet.findById(petId);

    if (!user || !pet) {
      return res.status(404).json({ success: false, message: "User or Pet not found" });
    }

    if (pet.adoptionStatus === "adopted" || pet.adoptionStatus === "owned") {
      return res.status(400).json({ success: false, message: "Pet already adopted or owned" });
    }

    pet.adoptionStatus = "adopted";
    pet.adoptedBy = userId;
    await pet.save();

    user.adoptedPets.push(pet._id);
    await user.save();

    res.status(200).json({ success: true, message: "Pet adopted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete Pet
const deletePet = async (req, res) => {
  const { petId } = req.params;

  try {
    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({ success: false, message: "Pet not found" });
    }

    const user = await User.findById(pet.owner);
    if (user) {
      user.pets = user.pets.filter((p) => p.toString() !== petId);
      await user.save();
    }

    await pet.deleteOne();
    res.status(200).json({ success: true, message: "Pet deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get Pet by ID
const getPetById = async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id)
      .populate("owner", "name email phoneNumber role")
      .exec();

    if (!pet) {
      return res.status(404).json({ success: false, message: "Pet not found" });
    }

    const safePet = {
      _id: pet._id,
      name: pet.name,
      type: pet.type,
      breed: pet.breed,
      age: pet.age,
      size: pet.size,
      gender: pet.gender,
      description: pet.description,
      petPic: pet.petPic,
      location: pet.location,
      healthInfo: pet.healthInfo,
      behavioralTraits: pet.behavioralTraits,
      reasonForAdoption: pet.reasonForAdoption,
      livingEnvironmentPreferences: pet.livingEnvironmentPreferences,
      additionalPhotos: pet.additionalPhotos,
      petDocuments: pet.petDocuments,
      adoptionStatus: pet.adoptionStatus.toLowerCase(),
      owner: {
        _id: pet.owner._id,
        name: pet.owner.name,
        email: pet.owner.email,
        phoneNumber: pet.owner.phoneNumber,
        role: pet.owner.role,
      },
    };

    res.status(200).json({ success: true, pet: safePet });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// Get Pets by User
const getPetsByUser = async (req, res) => {
  const { userId } = req.params;
  try {
    const pets = await Pet.find({ owner: userId }).populate("owner", "name email");
    res.status(200).json({
      success: true,
      pets,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get Pets by User (public route - no authentication required)
const getPetsByUserIdPublic = async (req, res) => {
  const { userId } = req.params;
  try {
    const pets = await Pet.find({ owner: userId }).populate("owner", "name email");
    res.status(200).json({
      success: true,
      pets,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


module.exports = {
  getAllPets,
  addPet,
  viewPetsForAdoption,
  adoptPet,
  updatePet,
  deletePet,
  getPetById,
  getPetsByUser,
  getPetsByUserIdPublic
};