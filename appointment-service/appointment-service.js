//Load express
const express = require("express");
const app = express();
const axios = require("axios");

//Load mongoose
const mongoose = require("mongoose");
const appointments = require("./appointments");
require("./appointments")
const User = mongoose.model("Appointments");
mongoose.connect("mongodb+srv://YoussefSeyam:Admin@userservice.8lohq.mongodb.net/UserService");

//Load bodyparser
const bodyParser = new require("body-parser");

app.use(bodyParser.json());

app.get('/',(req,res)=>{
    res.send("This is appointment service main endpoint!");
})

app.post("/appointment",async (req, res) => {
    try {
        const { patientId, doctorId, date, time, reason, status } = req.body;

        // Validate input
        if (!patientId || !doctorId || !date || !time || !reason || !status) {
            return res.status(400).json({ message: "All fields are required" });
        }
     
        const PatientResponse = await axios.get('http://user-service:4545/user/'+patientId);
            if(PatientResponse.data == 404){
                res.status(404).json({error: "Patient Not Found"});
            }
            const PatData = PatientResponse.data
            const PatID = PatData._id;


        const DoctorResponse = await axios.get('http://doctor-service:5005/doctor/'+doctorId);
        if(DoctorResponse.data == 404){
            res.status(404).json({error: "Doctor Not Found"});
        }
        const DocData = DoctorResponse.data
        const DocID = DocData._id;


        // Create and save appointment
        const newAppointment = new appointments({ patientId: PatID, doctorId: DocID, date, time, reason, status: "Scheduled" });

        const removeSlotPayload = {
          date: date,
          TimeSlot: time
        };
        
        const removeSlotResponse = await axios.post(`http://doctor-service:5005/removeAvailability/${doctorId}`, removeSlotPayload); 
        

        if (removeSlotResponse.status === 200) {
          console.log("Removed slot from doctor availability")
        } else {
          return res.status(500).json({
            message: "Failed to update doctor availability."
          });
        }

        const addToMedicalRecord = {
          appointmentId: newAppointment._id,
          doctorId: DocID,
          date,
          time,
          reason,
          status: "Scheduled"
        }

        const RecordResponse = await axios.put('http://medical-records-service:5050/addAppointment/'+PatID, addToMedicalRecord);


        if(RecordResponse.status === 200){
          await newAppointment.save();
          return res.status(201).json({
            message:"Appointment created and added to medical record",
            appointment: newAppointment
          });
        } else{
          return res.status(500).json({
            message:"Failed to update medical record. Appointment wasn not saved"
          });
        }

    } catch (error) {
        console.error(error);
        if(error.response){
          return res.status(error.response.status).json({
            message:"Medical record service error",
            error: error.response.data
          });
        }
        res.status(500).json({ message: "Server error", error: error.message });
    }
})

app.get("/appointment/:id", async (req, res) => {
    try {
      const appointment = await appointments.findById(req.params.id)

  
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
  
      res.json(appointment);
    } catch (error) {
      res.status(500).json({ error: "Server error", details: error.message });
    }
  });

app.get("/appointment/patient/:patientId", async (req, res) => {
    try {
      const appointments = await appointments.find({ patientId: req.params.patientId })
        .populate("doctorId")
        .sort({ date: 1 });
  
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ error: "Server error", details: error.message });
    }
  });



app.delete("/appointment/:id", async (req, res) => {
  try {
    const appointmentId = req.params.id;

    // Find the appointment
    const appointment = await appointments.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Call Medical Record service to delete the appointment
    const medicalRecordResponse = await axios.put('http://medical-records-service:5050/removeAppointment/' + appointment.patientId + "/"+ appointmentId);

    if (medicalRecordResponse.status === 200) {
      console.log("HIHIHIHIHIH");
      const DoctorResponse = await axios.get('http://doctor-service:5005/findDoctorById/'+appointment.doctorId);
        if(DoctorResponse.data == 404){
            res.status(404).json({error: "Doctor Not Found"});
        }
        const DocData = DoctorResponse.data
        const DocID = DocData.doctorId;

      const restoreSlotResponse = await axios.post(
        `http://doctor-service:5005/restoreAvailability/${DocID}`,
        {
          date: appointment.date,
          TimeSlot: appointment.time, // assuming the field name is 'time'
        }
      );
  
      if (restoreSlotResponse.status !== 200) {
        return res.status(500).json({
          message: "Failed to restore doctor's availability. Deletion aborted.",
        });
      }

      // Only delete from appointment DB if Medical Record deletion was successful
      await appointments.findByIdAndDelete(appointmentId);

      return res.status(200).json({
        message: "Appointment deleted from both services successfully",
      });
    } else {
      return res.status(500).json({
        message: "Failed to remove appointment from medical record. Deletion aborted.",
      });
    }
  } catch (error) {
    console.error("Error deleting appointment:", error.message);

    if (error.response) {
      return res.status(error.response.status).json({
        message: "Medical record service error",
        error: error.message,
      });
    }

    return res.status(500).json({ message: "Server error", error: error.message });
  }
});


app.put("/appointment/:id", async (req, res) => {
  try {
    const appointmentId = req.params.id;

    // Find and update the appointment in Appointment DB
    const appointment = await appointments.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Update appointment fields locally
    if (req.body.date) appointment.date = req.body.date;
    if (req.body.time) appointment.time = req.body.time;
    if (req.body.doctorId) appointment.doctorId = req.body.doctorId;
    if(req.body.reason) appointment.reason = req.body.reason;
    if(req.body.status) appointment.status = req.body.status;

    await appointment.save();

    // Call Medical Record Service to update appointment there as well
    const response = await axios.put(
      `http://medical-records-service:5050/updateAppointment/`+ appointment.patientId + '/' + appointmentId,
      {
        date: req.body.date,
        time: req.body.time,
        doctorId: req.body.doctorId,
        reason: req.body.reason,
        status: req.body.status,
      }
    );

    if (response.status === 200) {
      return res.status(200).json({
        message: "Appointment updated successfully in both services",
        updatedAppointment: appointment,
      });
    } else {
      return res.status(500).json({
        message: "Failed to update appointment in medical record service",
      });
    }
  } catch (error) {
    console.error("Error updating appointment:", error.message);

    if (error.response) {
      return res.status(error.response.status).json({
        message: "Medical record service error",
        error: error.response.data,
      });
    }

    return res.status(500).json({ message: "Server error", error: error.message });
  }
});


app.listen(4000,() =>{
    console.log("Up and running! -- This is the Appointment Service");
})
module.exports = app;
