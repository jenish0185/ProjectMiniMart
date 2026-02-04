const express = require("express");
const router = express.Router();
const verifyAuth = require("../middlewares/authMiddleware");

// Destructure the controller functions
const {
    createAdoptionRequest,
    getAllAdoptionRequests,
    getAdoptionRequestById,
    updateAdoptionRequest,
    deleteAdoptionRequest,
    getUserAdoptionRequests, // Add the new function here
} = require("../controllers/adoptionRequest.controller");

// Routes
router.post("/", verifyAuth, createAdoptionRequest);
router.get("/", verifyAuth, getAllAdoptionRequests);
router.get("/:id", verifyAuth, getAdoptionRequestById);
router.put("/:id", verifyAuth, updateAdoptionRequest);
router.delete("/:id", verifyAuth, deleteAdoptionRequest);

// New route for fetching user-specific adoption requests
router.get("/user/:userId", verifyAuth, getUserAdoptionRequests);

module.exports = router;