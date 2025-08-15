import {Spring} from '../models/Spring-model.js';
import { Report } from '../models/Report-model.js';


export const getAllSprings = async (req, res) => {

  const springs = await Spring.find();

  res.status(200).json(springs);
};

// export const addSpring = async (req, res) => {

//   const { name, district, location, usage, flowRate, status } = req.body;

//   const spring = await Spring.create({
//     name, district, location, usage, flowRate, status,
//     addedBy: req.user.id
//   });
  
//   res.status(201).json(spring);
// };

// server/controllers/springController.js


//! Add a new spring
export const addSpring = async (req, res) => {
  try {
    const {
      name,
      district,
      usage,
      flowRate,
      status,
      lat,
      lng
    } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ message: "Latitude and Longitude are required." });
    }

    const newSpring = new Spring({
      name,
      district,
      usage,
      flowRate,
      status,
      addedBy: req.user.id, // assuming authentication middleware sets req.user
      location: {
        type: "Point",
        coordinates: [lng, lat] // Important: GeoJSON format [lng, lat]
      }
    });

    await newSpring.save();
    res.status(201).json({ message: "Spring added successfully",  newSpring });
  } catch (error) {
    console.error("Error adding spring:", error);
    res.status(500).json({ message: "Failed to add spring" });
  }
};


//! Get details about a spring
export const getSpring = async (req, res) => {
  const { id } = req.params;

  const spring = await Spring.findById(id);

  res.status(200).json(spring);
}


//! Update a spring detail
// export const updateSpring = async (req, res) => {
//   const { id } = req.params; // Assuming the spring ID is passed as a URL parameter
//   const { usage, flowRate, status } = req.body;

//   try {
//     // Find the spring by ID and update the specified fields
//     const updatedSpring = await Spring.findByIdAndUpdate(
//       id,
//       {  usage, flowRate, status },
//       { new: true, runValidators: true } // Options to return the updated document and run validators
//     );

//     if (!updatedSpring) {
//       return res.status(404).json({ message: 'Spring not found' });
//     }

//     res.status(200).json(updatedSpring);
//   } catch (error) {
//     res.status(500).json({ message: 'Error updating spring', error: error.message });
//   }
// }

export const updateSpring = async (req, res) => {
  const { id } = req.params;
  const { usage, flowRate, status } = req.body;

  try {
    const updatedSpring = await Spring.findByIdAndUpdate(
      id,
      { usage, flowRate, status },
      { new: true, runValidators: true }
    );

    if (!updatedSpring) return res.status(404).json({ message: 'Spring not found' });

    // Emit to all connected clients
    const io = req.app.get('io');
    io.emit('springUpdated', updatedSpring);

    res.status(200).json(updatedSpring);
  } catch (error) {
    res.status(500).json({ message: 'Error updating spring', error: error.message });
  }
};



//! Delete a spring
export const deleteSpring = async (req, res) => {
  const { id } = req.params; // Extract the spring ID from the request parameters

  try {
    // Find the spring by ID and delete it
    const deletedSpring = await Spring.findByIdAndDelete(id);

    if (!deletedSpring) {
      return res.status(404).json({ message: 'Spring not found', success: false });
    }

    // Delete all reports associated with the deleted spring
    await Report.deleteMany({ spring: id });

    res.status(200).json({ message: 'Spring deleted successfully', success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting spring', error: error.message });
  }
}



//! Geo Search Controller
export const getNearbySprings = async (req, res) => {
  const { lat, lng, radius = 5 } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ message: "Latitude and longitude are required." });
  }

  try {
    const springs = await Spring.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: parseFloat(radius) * 1000, // meters
        },
      },
    });

    res.status(200).json(springs);
  } catch (err) {
    console.error("Geo search failed:", err);
    res.status(500).json({ message: "Failed to find nearby springs" });
  }
};
