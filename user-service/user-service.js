//Load express
const express = require("express");
const app = express();
const axios = require("axios");

const jwt = require("jsonwebtoken");

//Load mongoose
const mongoose = require("mongoose");
require("./users")
const User = mongoose.model("Patient");
mongoose.connect("mongodb+srv://YoussefSeyam:Admin@userservice.8lohq.mongodb.net/UserService");

//Load bodyparser
const bodyParser = new require("body-parser");
app.use(bodyParser.json());

app.get('/',(req,res)=>{
    res.send("This is user service main endpoint!");
})

app.post("/User",async (req,res)=>{
    try{
        // Validate required fields
        const requiredFields = ["firstName", "lastName", "dateOfBirth", "gender", "email", "phone", "weight","height", "bloodType"];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({ error: `${field} is required.` });
            }
        }

        const lastPatient  = await User.findOne().sort({ _id: -1 })
        const lastIdNumber = lastPatient ? parseInt(lastPatient.patientId.split("-")[1]) : 0;
        const PatientID= `PAT-${String(lastIdNumber + 1).padStart(5, "0")}`;
        var newUser = {
            firstName:req.body.firstName,
            lastName: req.body.lastName,
            dateOfBirth: req.body.dateOfBirth,
            gender: req.body.gender,
            email: req.body.email,
            phone:req.body.phone,
            address: req.body.address,
            patientId: PatientID,
            password: req.body.password
        }

        var user = new User(newUser)

        await user.save();

        const medicalRecordResponse = await axios.post("http://localhost:5050/medical-records", {
            patient: PatientID, // Reference to the new user's _id
            emergencyContact:[],
            allergies: [],
            chronicDiseases: [],
            pastSurgeries: [],
            currentMedications: [],
            vaccinationRecords: [],
            bloodType:  req.body.bloodType, 
            weight:  req.body.weight, 
            height:  req.body.height,
            appointments:[],
            diagnoses:[],
            treatmentPlans:[],
            labResults:[],
            radiologyReports:[],
            insuranceProvider:""
        });
        
        console.log("Medical Record Created:");

        res.status(201).json({ message: "A new user and medical record have been created successfully", user: newUser });

    }catch(err){
        console.error("Error creating user:", err);

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

app.get("/users",(req,res) =>{
    User.find().then((users) =>{
        res.json(users)
    }).catch(err => {
        if(err){
            throw err;
        }
    })
})

app.get("/user/:patientId",(req,res)=>{
    User.findOne({patientId: req.params.patientId}).then((user)=>{

        if(user){
            res.json(user)
        }
        else{
            res.send("404")
        }

    }).catch(err =>{
        throw err;
    })
})

app.put("/updateUser/:patientId",async (req,res) =>{
    try{
        const{firstName, lastName, email, password,phone,address}=req.body;
        const user = await User.findOne({patientId: req.params.patientId});
        if (!user) return res.status(404).json({ message: "User not found" });
        user.lastName = lastName || user.lastName;
        user.firstName = firstName || user.firstName;
        user.email = email || user.email;
        user.password = password || user.password;
        user.phone = phone || user.phone;
        user.address = address || user.address;

        await user.save();

        const updateResponse = await axios.put('http://localhost:5050/updatePatient/'+user._id,req.body);
        if(updateResponse.data == 404){
            res.status(404).json({error: "Medical record Not Updated"});
        }

        res.json({message: "user updated successfully", user});
    }catch(err){
        if(err){
            res.status(500).json({error: err.message});
            throw err;
        }
    }
})

app.delete("/deleteUser/:patientId",async (req,res)=>{
    try{
        const user = await User.findOneAndDelete({patientId: req.params.patientId});
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json({ message: "User deleted successfully" });
    }catch(err){
        res.status(500).json({ error: err.message });
    }
})

app.post("/validateUser/:PatientId",async (req,res)=>{
   try{
        const{email, password}= req.body;
        const user = await User.findOne({patientId:req.params.PatientId});

        if(!user){
            return res.status(404).json({ message: "User not found" });
        }
        if(email!==user.email || password !== user.password){
            return res.status(401).json({ message: "Incorrect Credentials" });
        }
        res.json({ message: "User Validated Successfully" });
   }catch(err){
    res.status(500).json({ error: err.message });
   }
})

app.listen(4545,() =>{
    console.log("Up and running! -- This is the User Service");
})

