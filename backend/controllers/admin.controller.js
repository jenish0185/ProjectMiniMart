// controllers/admin.controller.js
const User = require("../models/user.model");
const Pet = require("../models/pet.model");
const AdoptionRequest = require("../models/adoptionRequest.model");

// View All Users
const viewAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }); // Exclude passwords
    res.status(200).json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update User Details (Admin Only)
const updateUserDetails = async (req, res) => {
  const { userId } = req.params;
  const { name, email, profilePic, phoneNumber } = req.body;

  try {
    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Validate email format (optional but recommended)
    if (email && !/.+\@.+\..+/.test(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }

    // Update user details
    user.name = name || user.name;
    user.email = email || user.email;
    user.profilePic = profilePic || user.profilePic;
    user.phoneNumber = phoneNumber || user.phoneNumber;

    // Save the updated user
    await user.save();

    res.status(200).json({
      success: true,
      message: "User details updated successfully",
      user,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete a User (Admin Only)
const deleteUser = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    // Delete associated pets if needed
    await Pet.deleteMany({ _id: { $in: user.pets } });
    await User.findByIdAndDelete(userId);
    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update User Role (Admin Only)
const updateUserRole = async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (!["individual", "shelter", "admin"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role specified" });
    }
    user.role = role;
    await user.save();
    res.status(200).json({ success: true, message: "User role updated successfully", user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// View All Pets (Including Adopted Ones)
const viewAllPets = async (req, res) => {
  try {
    const pets = await Pet.find().populate("owner", "name email role");
    res.status(200).json({ success: true, pets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update Pet Details (Admin Only)
const updatePetDetails = async (req, res) => {
  const { petId } = req.params;
  const { name, breed, age, gender, size, description, petPic } = req.body;

  // Define valid enums for validation
  const validGenders = ["Male", "Female", "Other"];
  const validSizes = ["Small", "Medium", "Large"];

  // Validate gender
  if (gender && !validGenders.includes(gender)) {
    return res.status(400).json({
      success: false,
      message: `Invalid gender. Allowed values are: ${validGenders.join(", ")}`,
    });
  }

  // Validate size
  if (size && !validSizes.includes(size)) {
    return res.status(400).json({
      success: false,
      message: `Invalid size. Allowed values are: ${validSizes.join(", ")}`,
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

// Delete a Pet (Admin Only)
const deletePet = async (req, res) => {
  const { petId } = req.params;
  try {
    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({ success: false, message: "Pet not found" });
    }

    // Delete associated adoption requests if needed
    await AdoptionRequest.deleteMany({ petId: petId });

    // Delete the pet
    await Pet.findByIdAndDelete(petId);

    res.status(200).json({ success: true, message: "Pet deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// View All Adoption Requests
const viewAllAdoptionRequests = async (req, res) => {
  try {
    const adoptionRequests = await AdoptionRequest.find()
      .populate("petId", "name type petPic") // Populate pet details
      .populate("requesterId", "name email role") // Populate requester details
      .populate("ownerId", "name email role"); // Populate owner details
    res.status(200).json({ success: true, adoptionRequests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete an Adoption Request (Admin Only)
const deleteAdoptionRequest = async (req, res) => {
  const { requestId } = req.params;
  try {
    const adoptionRequest = await AdoptionRequest.findById(requestId);
    if (!adoptionRequest) {
      return res.status(404).json({ success: false, message: "Adoption request not found" });
    }
    await AdoptionRequest.findByIdAndDelete(requestId);
    res.status(200).json({ success: true, message: "Adoption request deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Fetch Adoption Statistics
const getAdoptionStatistics = async (req, res) => {
  const { period } = req.query; // "week", "month", or "year"
  try {
    const matchQuery = {};
    const groupByField = {};

    if (period === "week") {
      groupByField.$dayOfWeek = "$createdAt";
    } else if (period === "month") {
      groupByField.$dayOfMonth = "$createdAt";
    } else if (period === "year") {
      groupByField.$month = "$createdAt";
    }

    const stats = await Pet.aggregate([
      {
        $match: {
          isAdopted: true,
          createdAt: { $exists: true },
        },
      },
      {
        $group: {
          _id: groupByField,
          dogs: {
            $sum: {
              $cond: [{ $eq: ["$type", "Dog"] }, 1, 0],
            },
          },
          cats: {
            $sum: {
              $cond: [{ $eq: ["$type", "Cat"] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          name: "$_id",
          dogs: 1,
          cats: 1,
        },
      },
      { $sort: { name: 1 } },
    ]);

    res.status(200).json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Fetch Statistics (Percentage Changes)
const getStatistics = async (req, res) => {
  try {
    // Fetch counts for the current month
    const currentMonth = new Date().getMonth() + 1; // Current month (1-12)
    const currentYear = new Date().getFullYear(); // Current year

    // Users: Current and Previous Month Counts
    const currentUsersCount = await User.countDocuments({
      createdAt: {
        $gte: new Date(currentYear, currentMonth - 1, 1), // Start of current month
        $lte: new Date(currentYear, currentMonth, 0), // End of current month
      },
    });

    const previousUsersCount = await User.countDocuments({
      createdAt: {
        $gte: new Date(currentYear, currentMonth - 2, 1), // Start of previous month
        $lte: new Date(currentYear, currentMonth - 1, 0), // End of previous month
      },
    });

    console.log("Users Count:");
    console.log(`- Current Month: ${currentUsersCount}`);
    console.log(`- Previous Month: ${previousUsersCount}`);

    // Pets: Current and Previous Month Counts (Dogs and Cats)
    const currentDogsCount = await Pet.countDocuments({
      type: "Dog",
      createdAt: {
        $gte: new Date(currentYear, currentMonth - 1, 1),
        $lte: new Date(currentYear, currentMonth, 0),
      },
    });

    const previousDogsCount = await Pet.countDocuments({
      type: "Dog",
      createdAt: {
        $gte: new Date(currentYear, currentMonth - 2, 1),
        $lte: new Date(currentYear, currentMonth - 1, 0),
      },
    });

    const currentCatsCount = await Pet.countDocuments({
      type: "Cat",
      createdAt: {
        $gte: new Date(currentYear, currentMonth - 1, 1),
        $lte: new Date(currentYear, currentMonth, 0),
      },
    });

    const previousCatsCount = await Pet.countDocuments({
      type: "Cat",
      createdAt: {
        $gte: new Date(currentYear, currentMonth - 2, 1),
        $lte: new Date(currentYear, currentMonth - 1, 0),
      },
    });

    console.log("Pets Count:");
    console.log(`- Dogs:`);
    console.log(`  - Current Month: ${currentDogsCount}`);
    console.log(`  - Previous Month: ${previousDogsCount}`);
    console.log(`- Cats:`);
    console.log(`  - Current Month: ${currentCatsCount}`);
    console.log(`  - Previous Month: ${previousCatsCount}`);

    // Adoptions: Current and Previous Month Counts
    const currentAdoptionsCount = await Pet.countDocuments({
      isAdopted: true,
      createdAt: {
        $gte: new Date(currentYear, currentMonth - 1, 1),
        $lte: new Date(currentYear, currentMonth, 0),
      },
    });

    const previousAdoptionsCount = await Pet.countDocuments({
      isAdopted: true,
      createdAt: {
        $gte: new Date(currentYear, currentMonth - 2, 1),
        $lte: new Date(currentYear, currentMonth - 1, 0),
      },
    });

    console.log("Adoptions Count:");
    console.log(`- Current Month: ${currentAdoptionsCount}`);
    console.log(`- Previous Month: ${previousAdoptionsCount}`);

    // Calculate Percentage Changes
    const calculatePercentageChange = (current, previous) => {
      if (!previous || previous === 0) {
        // If there were no records in the previous period
        if (current > 0) {
          return 100; // Treat as a 100% increase
        }
        return 0; // No change if both current and previous are 0
      }
      return ((current - previous) / previous) * 100;
    };

    const usersChange = calculatePercentageChange(currentUsersCount, previousUsersCount);
    const dogsChange = calculatePercentageChange(currentDogsCount, previousDogsCount);
    const catsChange = calculatePercentageChange(currentCatsCount, previousCatsCount);
    const adoptionsChange = calculatePercentageChange(currentAdoptionsCount, previousAdoptionsCount);

    console.log("Calculated Percentage Changes:");
    console.log(`- Users Change: ${usersChange !== null ? `${usersChange.toFixed(1)}%` : "No data"}`);
    console.log(`- Dogs Change: ${dogsChange !== null ? `${dogsChange.toFixed(1)}%` : "No data"}`);
    console.log(`- Cats Change: ${catsChange !== null ? `${catsChange.toFixed(1)}%` : "No data"}`);
    console.log(`- Adoptions Change: ${adoptionsChange !== null ? `${adoptionsChange.toFixed(1)}%` : "No data"}`);

    // Return the statistics
    res.status(200).json({
      success: true,
      statistics: {
        usersChange,
        dogsChange,
        catsChange,
        adoptionsChange,
      },
    });
  } catch (err) {
    console.error("Error fetching statistics:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  viewAllUsers,
  updateUserDetails,
  deleteUser,
  updateUserRole,
  viewAllPets,
  deletePet,
  updatePetDetails,
  viewAllAdoptionRequests,
  deleteAdoptionRequest,
  getAdoptionStatistics,
  getStatistics, // Add the new endpoint here
};