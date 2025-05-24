const express = require("express");
const app = express();

const jwt = require("jsonwebtoken");
const axios = require("axios");

//Load mongoose
const mongoose = require("mongoose");
require("./medical-records")
const Records = mongoose.model("MedicalRecords");
mongoose.connect("mongodb+srv://YoussefSeyam:Admin@userservice.8lohq.mongodb.net/UserService");

//Load bodyparser
const bodyParser = new require("body-parser");
app.use(bodyParser.json());

app.get('/',(req,res)=>{
    res.send("This is Medical Records service main endpoint!");
})

app.post("/medical-records", async (req,res)=>{
  try{
    const{
        patient, emergencyContact, allergies, chronicDiseases, pastSurgeries, currentMedications, vaccinationRecords, bloodType, weight, height, appointments,
        diagnoses, treatmentPlans, labResults, radiologyReports, insuranceProvider
    } = req.body;

    const PatientResponse = await axios.get('http://user-service:4545/user/'+patient);
    if(PatientResponse.data == 404){
        res.status(404).json({error: "Patient Not Found"});
    }
    //Retreive Patient Data
    const patientData = PatientResponse.data;
    const patientId =  patientData._id;
    const patientName = patientData.firstName + " " + patientData.lastName;
    const patientDateOfBirth = patientData.dateOfBirth;
    const patientGender= patientData.gender;
    const patientEmail = patientData.email;
    const patientPhoneNumber = patientData.phone;
    const patientAddress = patientData.address;
    
    const Newrecord ={
        patient: patientId,
        patientName: patientName,
        dateOfBirth: patientDateOfBirth,
        gender: patientGender,
        email: patientEmail,
        phoneNumber:patientPhoneNumber,
        address:patientAddress,
        emergencyContact: emergencyContact,
        allergies:allergies,
        chronicDiseases:chronicDiseases,
        pastSurgeries:pastSurgeries,
        currentMedications:currentMedications,
        vaccinationRecords:vaccinationRecords,
        bloodType:bloodType,
        weight:weight,
        height:height,
        appointments:appointments,
        diagnoses:diagnoses,
        treatmentPlans:treatmentPlans,
        labResults:labResults,
        radiologyReports:radiologyReports,
        insuranceProvider:insuranceProvider,
    }

    const record = new Records(Newrecord);
    await record.save().then(() =>{
        console.log("New record Created")
    })

    res.status(201).json({ message: "Medical record created successfully", record });

  }catch(error){
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
}
})

app.put("/updatePatient/:patientId",async (req,res)=>{
    try{
        const updatedRecord = await Records.findOne({patient:req.params.patientId});
        if(!updatedRecord){
            res.status(400).json({error:"Medical Record not found for this patient"});
        }
        if (req.body.firstName && req.body.lastName) {
            updatedRecord.patientName = req.body.firstName + " " + req.body.lastName;
        }
        updatedRecord.email = req.body.email || updatedRecord.email;
        updatedRecord.phoneNumber = req.body.phone || updatedRecord.phoneNumber;
        updatedRecord.address = req.body.address || updatedRecord.address;
        await updatedRecord.save();
        res.status(200).json({message:"Patient medical record updated successfully",updatedRecord});
    } catch(error){
        console.error("Update failed:", error);
        res.status(500).json({ error: "Internal server error" });
    }
    
})

app.put("/addEmergencyContact/:patientId",async (req,res)=>{
    try{
        const updatedRecord = await Records.findOne({patient:req.params.patientId});
        if(!updatedRecord){
            res.status(400).json({error:"Medical Record not found for this patient"});
        }
        const emergencyContact={
            "name":req.body.name,
            "relationship":req.body.relationship,
            "phoneNumber":req.body.phoneNumber
        };
        updatedRecord.emergencyContact.push(emergencyContact);
        await updatedRecord.save();
        res.status(200).json({message:"Patient medical record updated successfully",updatedRecord});
    } catch(error){
        console.error("Update failed:", error);
        res.status(500).json({ error: "Internal server error" });
    }

})

app.put("/removeEmergencyContact/:patientId", async (req, res) => {
    try {
        const updatedRecord = await Records.findOne({ patient: req.params.patientId });

        if (!updatedRecord) {
            return res.status(400).json({ error: "Medical Record not found for this patient" });
        }

        // Filter out the contact with the given name
        const contactNameToRemove = req.body.name;

        const originalLength = updatedRecord.emergencyContact.length;
        updatedRecord.emergencyContact = updatedRecord.emergencyContact.filter(
            contact => contact.name !== contactNameToRemove
        );

        // Check if any contact was actually removed
        if (updatedRecord.emergencyContact.length === originalLength) {
            return res.status(404).json({ message: `No emergency contact found with the name '${contactNameToRemove}'` });
        }

        await updatedRecord.save();

        res.status(200).json({
            message: `Emergency contact '${contactNameToRemove}' removed successfully`,
            updatedRecord
        });
    } catch (error) {
        console.error("Remove failed:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.put("/updateEmergencyContactPhone/:patientId", async (req, res) => {
    try {
        const updatedRecord = await Records.findOne({ patient: req.params.patientId });

        if (!updatedRecord) {
            return res.status(400).json({ error: "Medical Record not found for this patient" });
        }

        const contactName = req.body.name;
        const newPhoneNumber = req.body.phoneNumber;

        let contactFound = false;

        updatedRecord.emergencyContact = updatedRecord.emergencyContact.map(contact => {
            if (contact.name === contactName) {
                contact.phoneNumber = newPhoneNumber;
                contactFound = true;
            }
            return contact;
        });

        if (!contactFound) {
            return res.status(404).json({ message: `No emergency contact found with the name '${contactName}'` });
        }

        await updatedRecord.save();

        res.status(200).json({
            message: `Phone number for emergency contact '${contactName}' updated successfully`,
            updatedRecord
        });
    } catch (error) {
        console.error("Update failed:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.put("/updateVitals/:patientId", async (req, res) => {
    try {
        const record = await Records.findOne({ patient: req.params.patientId });

        if (!record) {
            return res.status(404).json({ error: "Medical Record not found for this patient" });
        }

        // Update only if values are provided in the request
        if (req.body.weight !== undefined) {
            record.weight = req.body.weight;
        }

        if (req.body.height !== undefined) {
            record.height = req.body.height;
        }

        await record.save();

        res.status(200).json({
            message: "Vitals updated successfully",
            updatedVitals: {
                weight: record.weight,
                height: record.height
            }
        });
    } catch (error) {
        console.error("Error updating vitals:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.put("/addAppointment/:patientId", async (req, res) => {
    try {
        const record = await Records.findOne({ patient: req.params.patientId });

        if (!record) {
            return res.status(404).json({ error: "Medical record not found" });
        }

        const newAppointment = {
            appointmentId: req.body.appointmentId,
            doctorId: req.body.doctorId,
            date: req.body.date,
            time: req.body.time,
            reason: req.body.reason,
            status: req.body.status || "Scheduled"
        };

        record.appointments.push(newAppointment);
        await record.save();

        res.status(200).json({ message: "Appointment added", appointments: record.appointments });
    } catch (error) {
        console.error("Error adding appointment:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.put("/removeAppointment/:patientId/:appointmentId", async (req, res) => {
    try {
        const record = await Records.findOne({ patient: req.params.patientId });

        if (!record) {
            return res.status(404).json({ error: "Medical record not found" });
        }
        const originalLength = record.appointments.length;

        record.appointments = record.appointments.filter(app =>
            app.appointmentId.toString() !== req.params.appointmentId
        );

        if (record.appointments.length === originalLength) {
            return res.status(404).json({ error: "Appointment not found" });
        }

        await record.save();

        res.status(200).json({ message: "Appointment removed", appointments: record.appointments });
    } catch (error) {
        console.error("Error removing appointment:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.put("/updateAppointment/:patientId/:appointmentId", async (req, res) => {
    try {
        const record = await Records.findOne({ patient: req.params.patientId });

        if (!record) {
            return res.status(404).json({ error: "Medical record not found" });
        }

        const appointment = record.appointments.find(app => 
            app.appointmentId.toString() === req.params.appointmentId
        );

        if (!appointment) {
            return res.status(404).json({ error: "Appointment not found" });
        }

        // Update only if the field exists in req.body
        if (req.body.date) appointment.date = req.body.date;
        if (req.body.time) appointment.time = req.body.time;
        if (req.body.doctorId) appointment.doctorId = req.body.doctorId;
        if (req.body.reason) appointment.reason = req.body.reason;
        if (req.body.status) appointment.status = req.body.status;

        

        await record.save();

        res.status(200).json({ message: "Appointment updated successfully", updatedAppointment: appointment });
    } catch (error) {
        console.error("Error updating appointment:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.put("/addTreatmentPlan/:patientId", async (req, res) => {
    try {
        const record = await Records.findOne({ patient: req.params.patientId });

        if (!record) {
            return res.status(404).json({ error: "Medical record not found" });
        }

        record.treatmentPlans.push(req.body);
        await record.save();

        res.status(200).json({ message: "Treatment plan added successfully", treatmentPlans: record.treatmentPlans });
    } catch (error) {
        console.error("Add treatment plan failed:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.put("/removeTreatmentPlan/:patientId/:treatmentId", async (req, res) => {
    try {
        const { patientId, treatmentId } = req.params;

        const record = await Records.findOne({ patient: patientId });

        if (!record) {
            return res.status(404).json({ error: "Medical record not found" });
        }

        const originalLength = record.treatmentPlans.length;
        record.treatmentPlans = record.treatmentPlans.filter(plan =>
            plan._id.toString() !== treatmentId
        );

        if (record.treatmentPlans.length === originalLength) {
            return res.status(404).json({ error: "Treatment plan not found" });
        }

        await record.save();

        res.status(200).json({ message: "Treatment plan removed successfully", treatmentPlans: record.treatmentPlans });
    } catch (error) {
        console.error("Remove treatment plan failed:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.put("/updateTreatmentPlan/:patientId/:treatmentId", async (req, res) => {
    try {
        const { patientId, treatmentId } = req.params;
        const {
            treatmentName,
            startDate,
            endDate,
            doctorId,
            progressNotes // optional: send array of new notes or one note object
        } = req.body;

        const record = await Records.findOne({ patient: patientId });

        if (!record) {
            return res.status(404).json({ error: "Medical record not found" });
        }

        const planToUpdate = record.treatmentPlans.id(treatmentId);

        if (!planToUpdate) {
            return res.status(404).json({ error: "Treatment plan not found" });
        }

        // Update the treatment plan fields if provided
        if (treatmentName) planToUpdate.treatmentName = treatmentName;
        if (startDate) planToUpdate.startDate = startDate;
        if (endDate) planToUpdate.endDate = endDate;
        if (doctorId) planToUpdate.doctorId = doctorId;

        // Add new progress notes if provided
        if (progressNotes && progressNotes.length > 0) {
            // You can send a single note or array of notes
            if (Array.isArray(progressNotes)) {
                planToUpdate.progressNotes.push(...progressNotes);
            } else {
                planToUpdate.progressNotes.push(progressNotes);
            }
        }

        await record.save();

        res.status(200).json({
            message: "Treatment plan updated successfully",
            updatedTreatment: planToUpdate
        });
    } catch (error) {
        console.error("Update treatment plan failed:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post("/addInvestigation/:patientId/:doctorId", async (req, res) => {
    try {
      const { testType, testName } = req.body;
      const { patientId, doctorId } = req.params;
  
      // Validate testType
      if (!["Lab", "Radiology"].includes(testType)) {
        return res.status(400).json({ error: "Invalid test type. Must be either 'Lab' or 'Radiology'." });
      }
  
      // Find patient record
      const record = await Records.findOne({ patient: patientId });
      if (!record) {
        return res.status(404).json({ error: "Patient medical record not found." });
      }
  
      // Add the new investigation to the patient's record
      const newInvestigation = {
        testType,
        testName,
        status: "Requested",  // default status is Requested
        doctorId: doctorId,
        requestedDate: new Date()
      };
  
      record.investigations.push(newInvestigation);
  
      // Save the updated record
      await record.save();
  
      res.status(201).json({
        message: "Investigation added successfully.",
        investigation: newInvestigation
      });
    } catch (error) {
      console.error("Add investigation failed:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/updateInvestigationStatus/:patientId/:investigationId", async (req, res) => {
    try {
      const { patientId, doctorId, investigationId } = req.params;
      const { status, result, fileUrl } = req.body;
  
      // Validate status
      if (!["Requested", "Approved", "Undergoing", "Completed"].includes(status)) {
        return res.status(400).json({ error: "Invalid status. Must be one of 'Requested', 'Approved', 'Undergoing', or 'Completed'." });
      }
  
      // Find patient record
      const record = await Records.findOne({ patient: patientId });
      if (!record) {
        return res.status(404).json({ error: "Patient medical record not found." });
      }
  
      // Find the investigation by its ID
      const investigation = record.investigations.id(investigationId);
      if (!investigation) {
        return res.status(404).json({ error: "Investigation not found." });
      }
  
      // Update the status of the investigation
      investigation.status = status;
  
      // If the status is "Completed", add the results to labResults or radiologyReports based on testType
      if (status === "Completed") {
        if (investigation.testType === "Lab") {
          record.labResults.push({
            testName: investigation.testName,
            date: new Date(),
            result: result,  // result from request body
            doctorId: investigation.doctorId,
            fileUrl: fileUrl || null  // Optional file URL
          });
        } else if (investigation.testType === "Radiology") {
          record.radiologyReports.push({
            scanType: investigation.testName,
            date: new Date(),
            findings: result,  // result from request body
            fileUrl: fileUrl || null  // Optional file URL
          });
        }
      }
  
      // Save the updated record
      await record.save();
  
      res.status(200).json({
        message: "Investigation status updated successfully",
        updatedInvestigation: investigation
      });
    } catch (error) {
      console.error("Update investigation status failed:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.delete("/removeInvestigation/:patientId/:investigationId", async (req, res) => {
    try {
      const { patientId, investigationId } = req.params;
  
      // Find patient record
      const record = await Records.findOne({ patient: patientId });
      if (!record) {
        return res.status(404).json({ error: "Patient medical record not found." });
      }
  
      // Find the investigation by its ID and remove it
      const investigationIndex = record.investigations.findIndex(inv => inv._id.toString() === investigationId);
      if (investigationIndex === -1) {
        return res.status(404).json({ error: "Investigation not found." });
      }
  
      // Remove the investigation from the investigations array
      record.investigations.splice(investigationIndex, 1);
  
      // Save the updated record
      await record.save();
  
      res.status(200).json({
        message: "Investigation removed successfully",
        updatedInvestigation: record.investigations
      });
    } catch (error) {
      console.error("Remove investigation failed:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  


app.listen(5050, () =>{
    console.log("Up and Running! -- This is Medical Records Service")
})