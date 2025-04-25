const mongoose = require("mongoose");

const AppointmentSchema = new mongoose.Schema(
    {
        patientId: {type: mongoose.Schema.Types.ObjectId, ref:"Patient", required:true},
        doctorId:{type:mongoose.Schema.Types.ObjectId, ref:"Doctors", required:true},
        date:{type:Date, required:true},
        time: {type:String, required:true},
        status: {type:String, enum:["Scheduled","Completed","Cancelled"], default:"Scheduled"}
    },
    { timestamps: true } // ✅ Ensure timestamps is placed here properly
  );

  module.exports = mongoose.model("Appointments", AppointmentSchema);
