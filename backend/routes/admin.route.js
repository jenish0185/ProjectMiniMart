const express = require("express");
const router = express.Router();
const {
  viewAllUsers,
  deleteUser,
  updateUserRole,
  viewAllPets,
  updatePetDetails,
  deletePet,
  viewAllAdoptionRequests,
  deleteAdoptionRequest,
  getAdoptionStatistics,
  updateUserDetails,
  getStatistics,
} = require("../controllers/admin.controller");
const verifyAuth = require("../middlewares/authMiddleware");
const isAdmin = require("../middlewares/adminMiddleware");

// Admin Routes
router.get("/users", verifyAuth, isAdmin, viewAllUsers); // View all users
router.delete("/users/:userId", verifyAuth, isAdmin, deleteUser); // Delete a user
router.put("/users/:userId/role", verifyAuth, isAdmin, updateUserRole); // Update user role
router.put("/users/:userId/details", verifyAuth, isAdmin, updateUserDetails); // Update user details

router.get("/pets", verifyAuth, isAdmin, viewAllPets); // View all pets
router.put("/pets/:petId", verifyAuth, isAdmin, updatePetDetails); // Update pet details
router.delete("/pets/:petId", verifyAuth, isAdmin, deletePet); // Delete a pet


router.get("/adoption-requests", verifyAuth, isAdmin, viewAllAdoptionRequests); // View all adoption requests
router.delete("/adoption-requests/:requestId", verifyAuth, isAdmin, deleteAdoptionRequest); // Delete an adoption request
router.get("/adoption-statistics", verifyAuth, isAdmin, getAdoptionStatistics); // Fetch adoption statistics

router.get("/statistics", verifyAuth, isAdmin, getStatistics);
module.exports = router;