const AdoptionRequest = require("../models/adoptionRequest.model");
const Pet = require("../models/pet.model"); // Import the Pet model
// const Notification = require("../models/notification.model");

// Helper function for centralized error handling
const handleError = (res, error, message = "An error occurred.") => {
    console.error(message, error);
    res.status(500).json({ message, error: error.message });
};

// Create a new adoption request
const createAdoptionRequest = async (req, res) => {
    try {
        const {
            petId,
            requesterId,
            ownerId,
            fullName,
            email,
            phoneNumber,
            address,
            previousExperience,
            adoptionReason,
        } = req.body;

        // Validate required fields
        if (!petId || !requesterId || !ownerId || !fullName || !email || !phoneNumber || !address || !adoptionReason) {
            return res.status(400).json({ message: "All required fields must be provided." });
        }

        // Create a new adoption request
        const newRequest = new AdoptionRequest({
            petId,
            requesterId,
            ownerId,
            fullName,
            email,
            phoneNumber,
            address,
            previousExperience,
            adoptionReason,
        });

        // Save the adoption request
        const savedRequest = await newRequest.save();

        // Fetch the pet details
        const pet = await Pet.findById(petId);

        // // Send notification to the pet owner
        // const ownerNotification = new Notification({
        //     userId: ownerId,
        //     role: "Shelter", // Assuming the owner is a shelter
        //     type: "adoption_request",
        //     message: `A new adoption request has been submitted for ${pet.name}.`,
        // });
        // await ownerNotification.save();

        // // Send notification to the admin
        // const adminNotification = new Notification({
        //     adminId: null, // Replace with actual admin ID if available
        //     role: "Admin",
        //     type: "adoption_request",
        //     message: `A new adoption request has been submitted for ${pet.name}.`,
        // });
        // await adminNotification.save();

        res.status(201).json({
            message: "Adoption request created successfully.",
            data: savedRequest,
        });
    } catch (error) {
        handleError(res, error, "Failed to create adoption request.");
    }
};

// Get all adoption requests
const getAllAdoptionRequests = async (req, res) => {
    try {
        const requests = await AdoptionRequest.find()
            .populate("petId")
            .populate("requesterId")
            .populate("ownerId");

        res.status(200).json({
            message: "Adoption requests fetched successfully.",
            data: requests,
        });
    } catch (error) {
        handleError(res, error, "Failed to fetch adoption requests.");
    }
};

// Get a single adoption request by ID
const getAdoptionRequestById = async (req, res) => {
    try {
        const { id } = req.params;
        const request = await AdoptionRequest.findById(id)
            .populate("petId")
            .populate("requesterId")
            .populate("ownerId");

        if (!request) {
            return res.status(404).json({ message: "Adoption request not found." });
        }

        res.status(200).json({
            message: "Adoption request fetched successfully.",
            data: request,
        });
    } catch (error) {
        handleError(res, error, "Failed to fetch adoption request.");
    }
};

const updateAdoptionRequest = async (req, res) => {
    try {
        const { id } = req.params; // Adoption request ID
        const { action, ...updateData } = req.body; // Extract action and form data

        // Find the adoption request by ID and populate related fields
        const adoptionRequest = await AdoptionRequest.findById(id)
            .populate("petId")
            .populate("requesterId")
            .populate("ownerId");

        if (!adoptionRequest) {
            return res.status(404).json({ message: "Adoption request not found." });
        }

        const { petId, requesterId, ownerId } = adoptionRequest;

        // Handle specific actions (accept, reject, cancel)
        if (action === "accept") {
            // Update the pet's status to "adopted" and set the new owner
            petId.isAdopted = true;
            petId.adoptionStatus = "adopted";
            petId.owner = requesterId._id; // Change the owner to the requester
            petId.adoptedBy = requesterId._id; // Set the adoptedBy field

            // Save the updated pet
            await petId.save();

            // Update the current adoption request status to "accepted"
            adoptionRequest.adoptionStatus = "accepted";
            await adoptionRequest.save();

            // Reject all other pending adoption requests for the same pet
            await AdoptionRequest.updateMany(
                { petId: petId._id, adoptionStatus: "pending" },
                { adoptionStatus: "rejected" }
            );

            return res.status(200).json({
                message: "Adoption request accepted. All other pending requests for this pet have been rejected.",
                data: adoptionRequest,
            });
        } else if (action === "reject") {
            // Update the adoption request status to "rejected"
            adoptionRequest.adoptionStatus = "rejected";
            await adoptionRequest.save();

            return res.status(200).json({
                message: "Adoption request rejected.",
            });
        } else if (action === "cancel") {
            // Delete the adoption request
            await AdoptionRequest.findByIdAndDelete(id);

            return res.status(200).json({
                message: "Adoption request cancelled and deleted.",
            });
        }

        // Handle updates to form data (e.g., fullName, email, etc.)
        if (Object.keys(updateData).length > 0) {
            // Update the adoption request with the provided data
            Object.assign(adoptionRequest, updateData);
            await adoptionRequest.save();

            return res.status(200).json({
                message: "Adoption request updated successfully.",
                data: adoptionRequest,
            });
        }

        // If no valid action or update data is provided
        return res.status(400).json({ message: "Invalid request. No action or update data provided." });
    } catch (error) {
        console.error("Error updating adoption request:", error);
        return res.status(500).json({ message: "Failed to update adoption request.", error: error.message });
    }
};

// Delete an adoption request
const deleteAdoptionRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedRequest = await AdoptionRequest.findByIdAndDelete(id)
            .populate("petId")
            .populate("requesterId")
            .populate("ownerId");

        if (!deletedRequest) {
            return res.status(404).json({ message: "Adoption request not found." });
        }

        const { petId, requesterId, ownerId } = deletedRequest;

        // // Send notification to the requester
        // const requesterNotification = new Notification({
        //     userId: requesterId._id,
        //     role: requesterId.role, // Assuming the role is stored in the user model
        //     type: "adoption_request_deleted",
        //     message: `Your adoption request for ${petId.name} has been deleted.`,
        // });
        // await requesterNotification.save();

        // // Send notification to the pet owner
        // const ownerNotification = new Notification({
        //     userId: ownerId._id,
        //     role: ownerId.role, // Assuming the role is stored in the user model
        //     type: "adoption_request_deleted",
        //     message: `The adoption request for ${petId.name} has been deleted.`,
        // });
        // await ownerNotification.save();

        // // Send notification to the admin
        // const adminNotification = new Notification({
        //     adminId: null, // Replace with actual admin ID if available
        //     role: "Admin",
        //     type: "adoption_request_deleted",
        //     message: `The adoption request for ${petId.name} has been deleted.`,
        // });
        // await adminNotification.save();

        res.status(200).json({
            message: "Adoption request deleted successfully.",
        });
    } catch (error) {
        handleError(res, error, "Failed to delete adoption request.");
    }
};

// Get adoption requests for a specific user (as requester or owner)
const getUserAdoptionRequests = async (req, res) => {
    try {
        const { userId } = req.params;

        // Fetch adoption requests where the user is either the requester or the owner
        const requests = await AdoptionRequest.find({
            $or: [{ requesterId: userId }, { ownerId: userId }],
        })
            .populate("petId")
            .populate("requesterId")
            .populate("ownerId");

        res.status(200).json({
            message: "User adoption requests fetched successfully.",
            data: requests,
        });
    } catch (error) {
        handleError(res, error, "Failed to fetch user adoption requests.");
    }
};




// Export all functions
module.exports = {
    createAdoptionRequest,
    getAllAdoptionRequests,
    getAdoptionRequestById,
    updateAdoptionRequest,
    deleteAdoptionRequest,
    getUserAdoptionRequests, // Add the new function to the exports
};