// import mongoose from 'mongoose';

// const springSchema = new mongoose.Schema({

//   name: String,

//   district: String,

//   location: {
//     lat: Number,
//     lng: Number
//   },

//   usage: String,

//   flowRate: String,

//   status: {
//     type: String,
//     enum: ['Active', 'Low', 'Dry'],
//     default: 'Active'
//   },

//   addedBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User'
//   }

// }, { timestamps: true });

// // export default mongoose.model('Spring', springSchema);
// export const Spring = mongoose.model("Spring", springSchema);


import mongoose from 'mongoose';

const springSchema = new mongoose.Schema({
  name: String,

  district: String,

  location: {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
      default: "Point"
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true
    }
  },

  usage: String,

  flowRate: String,

  status: {
    type: String,
    enum: ['Active', 'Low', 'Dry'],
    default: 'Active'
  },

  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }

}, { timestamps: true });

// Add geospatial index for location
springSchema.index({ location: "2dsphere" });

export const Spring = mongoose.model("Spring", springSchema);
