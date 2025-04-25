const express = require("express");
const app = express();

const jwt = require("jsonwebtoken");
const axios = require("axios");

//Load mongoose
const mongoose = require("mongoose");
require("./doctors");
const Doctors = mongoose.model("Doctors");
mongoose.connect("mongodb+srv://YoussefSeyam:Admin@userservice.8lohq.mongodb.net/UserService");

//Load bodyparser
const bodyParser = new require("body-parser");
app.use(bodyParser.json());

app.get('/',(req,res)=>{
    res.send("This is Medical Records service main endpoint!");
})

app.post("/doctor",async (req,res)=>{
    try{
        const requiredFields = ["firstName", "lastName", "gender", "email", "experienceYears","password","specialization","licenseNumber"];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({ error: `${field} is required.` });
            }
        }
        const lastDoctor  = await Doctors.findOne().sort({ _id: -1 })
        const lastIdNumber = lastDoctor ? parseInt(lastDoctor.DoctorId.split("-")[1]) : 0;
        const DoctorID= `DOC-${String(lastIdNumber + 1).padStart(5, "0")}`;

        var newDoctor = {
            doctorId: DoctorID,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            gender: req.body.gender,
            email: req.body.email,
            password: req.body.password,
            specialization: req.body.specialization,
            licenseNumber: req.body.licenseNumber,
            phoneNumber: req.body.phoneNumber,
            experienceYears: req.body.experienceYears,
            workingHourse: req.body.workingHourse
        }

        var Doc = new Doctors(newDoctor);
        await Doc.save().then(() =>{
            console.log("New Doctor Created")
        })
        res.status(201).json({ message: "A new Doctor has been created successfully", Doc: newDoctor});
    }catch(err){
        console.error("Error creating Doctor:", err);

        // Handle Mongoose validation errors
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: err.message });
        }

        // Handle duplicate key error (e.g., email or phone already exists)
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern)[0]; // Get the field that caused duplication
            return res.status(400).json({ error: `The ${field} '${err.keyValue[field]}' is already in use.` });
        }

        // Handle other errors
        res.status(500).json({ error: "An internal server error occurred." });
    }
})

app.get("/doctors",async (req,res) =>{
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

        try {
        const doctors = await Doctors.find().skip(skip).limit(limit);
        res.json(doctors);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

app.get("/doctor/:doctorId",(req,res)=>{
    Doctors.findOne({doctorId: req.params.doctorId}).then((doctor)=>{

        if(doctor){
            res.json(doctor)
        }
        else{
            res.send("404")
        }

    }).catch(err =>{
        throw err;
    })
})

app.put("/updateDoctor/:doctorId",async (req,res) =>{
    try{
        const{firstName, lastName, email, password,specialization,phoneNumber,experienceYears,licenseNumber}=req.body;
        const doctor = await Doctors.findOne({doctorId: req.params.doctorId});
        if (!doctor) return res.status(404).json({ message: "Doctor not found" });
        doctor.lastName = lastName || doctor.lastName;
        doctor.firstName = firstName || doctor.firstName;
        doctor.email = email || doctor.email;
        doctor.password = password || doctor.password;
        doctor.specialization = specialization || doctor.specialization;
        doctor.phoneNumber = phoneNumber || doctor.phoneNumber;
        doctor.experienceYears = experienceYears || doctor.experienceYears;
        doctor.licenseNumber = licenseNumber || doctor.licenseNumber;
        await doctor.save();
        res.json({message: "doctor updated successfully", doctor});
    }catch(err){
        if(err){
            res.status(500).json({error: err.message});
            throw err;
        }
    }
})

app.delete("/deleteDoctor/:doctorId",async (req,res)=>{
    try{
        const doctor = await Doctors.findOneAndDelete({doctorId: req.params.doctorId});
        if (!doctor) return res.status(404).json({ message: "doctor not found" });
        res.json({ message: "doctor deleted successfully" });
    }catch(err){
        res.status(500).json({ error: err.message });
    }
})

app.post("/validateDoctor/:doctorId",async (req,res)=>{
    try{
         const{email, password}= req.body;
         const doctor = await Doctors.findOne({doctorId:req.params.doctorId});
 
         if(!doctor){
             return res.status(404).json({ message: "doctor not found" });
         }
         if(email!==doctor.email || password !== doctor.password){
             return res.status(401).json({ message: "Incorrect Credentials" });
         }
         res.json({ message: "doctor Validated Successfully" });
    }catch(err){
     res.status(500).json({ error: err.message });
    }
 })

 app.post("/removeAvailability/:doctorId", async (req, res) => {
    try {
        const { date, TimeSlot } = req.body;

        if (!date || !TimeSlot) {
            return res.status(400).json({ error: "Appointment date and time are required." });
        }

        const doctor = await Doctors.findOne({ doctorId: req.params.doctorId });

        if (!doctor) {
            return res.status(404).json({ error: "Doctor not found." });
        }

        // Convert appointmentDate to YYYY-MM-DD format for accurate comparison
        const formattedDate = new Date(date).toISOString().split("T")[0];

        // Find the availability entry for the given date
        const availabilityIndex = doctor.availability.findIndex(avail => 
            avail.date.toISOString().split("T")[0] === formattedDate
        );

        if (availabilityIndex === -1) {
            return res.status(404).json({ error: "No available slots found for the selected date." });
        }

        // Remove the specific time slot
        doctor.availability[availabilityIndex].TimeSlots = doctor.availability[availabilityIndex].TimeSlots.filter(
            slot => slot !== TimeSlot
        );

        // If there are no more time slots left for this date, remove the entire date entry
        if (doctor.availability[availabilityIndex].TimeSlots.length === 0) {
            doctor.availability.splice(availabilityIndex, 1);
        }

        // Save the updated doctor document
        await doctor.save();

        res.json({ message: "Availability slot removed successfully", doctor });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/restoreAvailability/:doctorId", async (req, res) => {
    try {
        const { date, TimeSlot } = req.body;

        if (!date || !TimeSlot) {
            return res.status(400).json({ error: "Appointment date and time are required." });
        }

        const doctor = await Doctors.findOne({ doctorId: req.params.doctorId });

        if (!doctor) {
            return res.status(404).json({ error: "Doctor not found." });
        }

        // Convert appointmentDate to YYYY-MM-DD format for accurate comparison
        const formattedDate = new Date(date).toISOString().split("T")[0];

        // Find the availability entry for the given date
        let availabilityEntry = doctor.availability.find(avail => 
            avail.date.toISOString().split("T")[0] === formattedDate
        );

        if (!availabilityEntry) {
            // If no entry exists for the date, create a new one
            availabilityEntry = {
                date: new Date(date),
                TimeSlots: []
            };
            doctor.availability.push(availabilityEntry);
        }

        // Check if the time slot already exists to prevent duplicates
        if (!availabilityEntry.TimeSlots.includes(TimeSlot)) {
            availabilityEntry.TimeSlots.push(TimeSlot);

            // Sort the TimeSlots array in chronological order
            availabilityEntry.TimeSlots.sort();
        }

        // Save the updated doctor document
        await doctor.save();

        res.json({ message: "Availability slot restored successfully", doctor });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/doctor/:doctorId/review", async (req, res) => {
    try {
        const { patientId, rating, comment } = req.body;
        const doctor = await Doctors.findOne({ doctorId: req.params.doctorId });

        if (!doctor) {
            return res.status(404).json({ error: "Doctor not found" });
        }

        const PatientResponse = await axios.get('http://localhost:4545/user/'+patientId);
        console.log(PatientResponse.data);
        if(PatientResponse.data == 404){
            res.status(404).json({error: "Patient Not Found"});
        }
        const patientData = PatientResponse.data;
        const patient =  patientData._id;
        const patientName = patientData.firstName + " " + patientData.lastName;

        // Add new review
        doctor.reviews.push({ patient,patientName, rating, comment });

        // Update average rating
        const totalReviews = doctor.reviews.length;
        const totalRating = doctor.reviews.reduce((sum, review) => sum + review.rating, 0);
        doctor.averageRating = totalRating / totalReviews;

        await doctor.save();
        res.status(201).json({ message: "Review added successfully", doctor });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/doctor/:doctorId/reviews", async (req, res) => {
    try {
        const doctor = await Doctors.findOne({ doctorId: req.params.doctorId }).select("reviews averageRating");

        if (!doctor) {
            return res.status(404).json({ error: "Doctor not found" });
        }

        res.json({
            averageRating: doctor.averageRating,
            reviews: doctor.reviews
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete("/doctor/:doctorId/review/:reviewId", async (req, res) => {
    try {
        const doctor = await Doctors.findOne({ doctorId: req.params.doctorId });

        if (!doctor) {
            return res.status(404).json({ error: "Doctor not found" });
        }

        // Filter out the review to be deleted
        doctor.reviews = doctor.reviews.filter(review => review._id.toString() !== req.params.reviewId);

        // Update average rating
        const totalReviews = doctor.reviews.length;
        const totalRating = doctor.reviews.reduce((sum, review) => sum + review.rating, 0);
        doctor.averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;

        await doctor.save();
        res.json({ message: "Review deleted successfully", doctor });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/doctors/specialization/:specialization", async (req, res) => {
    try {
        const specialization = req.params.specialization;

        // Find doctors matching the given specialization (case-insensitive)
        const doctors = await Doctors.find({ specialization: new RegExp(specialization, "i") });

        if (doctors.length === 0) {
            return res.status(404).json({ message: "No doctors found for this specialization." });
        }

        res.json(doctors);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.listen(5000, () =>{
    console.log("Up and Running! -- This is Doctor Service")
})