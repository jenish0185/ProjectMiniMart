const express = require("express");
const router = express.Router();
const {
  addPet,
  viewPetsForAdoption,
  adoptPet,
  updatePet,
  deletePet,
  getAllPets,
  getPetsByUser,
  getPetById,
  getPetsByUserIdPublic
} = require("../controllers/pet.controller");

const verifyAuth = require("../middlewares/authMiddleware"); // Assuming you already have the authMiddleware




// View Pets for Adoption
router.get("/view", viewPetsForAdoption);

// Add a Pet for Adoption (only the authenticated user can add a pet for themselves)
router.post("/add/:userId", verifyAuth, addPet);

// Adopt a Pet (ensure the authenticated user is the one attempting the adoption)
router.post("/adopt/:userId/:petId", verifyAuth, adoptPet);

// Update Pet Information (if you need to restrict updates, consider verifying pet ownership in your controller)
router.put("/update/:petId", verifyAuth, updatePet);

// Delete Pet (similarly, ensure proper authorization inside the controller)
// pet.route.js
router.delete("/delete/:petId", (req, res, next) => {
  console.log("Deleting pet with ID:", req.params.petId);  // Log the petId
  next();  // Proceed to the deletePet handler
}, deletePet);

// Get Pets by User (only fetch pets for the authenticated user)
router.get("/user-pets/:userId", verifyAuth, getPetsByUser);

// Get Pets by User ID (public route - no authentication required)
router.get("/user/:userId", getPetsByUserIdPublic);



router.get("/allpets", getAllPets);

router.get("/:id", getPetById);



module.exports = router;
