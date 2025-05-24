const mongoose = require("mongoose");

const PatientSchema = new mongoose.Schema(
    {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      dateOfBirth: { type: Date, required: true },
      gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
      email: { type: String, required: true, unique: true },
      phone: { type: String, required: true, unique: true },
      weight:{type:String, required:true},
      height:{type:String, required:true},
      bloodType:{type:String, required:true},
      address:{
        street:{type: String, required:true},
        HouseNumber:{type:String, required:true},
        aptNumber:{type:String, required:true},
        city:{type:String, required:true}
    },
      patientId: {type: String, unique: true, sparse:true, auto:false},
      password: {type:String, required:true},
    },
    { timestamps: true } // ✅ Ensure timestamps is placed here properly
  );

  module.exports = mongoose.model("Patient", PatientSchema);
