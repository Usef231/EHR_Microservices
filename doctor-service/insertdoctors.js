const axios = require('axios');
const fs = require('fs');
const path = require('path');
const mongoose = require("mongoose");
require("./doctors");
const Doctors = mongoose.model("Doctors");
mongoose.connect("mongodb+srv://YoussefSeyam:Admin@userservice.8lohq.mongodb.net/UserService");

// Read the doctors data from the JSON file
const doctorsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'doctors.json'), 'utf8'));

const apiUrl = "http://localhost:5005/doctor"; // Adjust URL to your actual API

async function insertDoctors() {
    await Doctors.deleteMany({});
    for (let doctor of doctorsData) {
        try {
            // Send a POST request for each doctor
            const response = await axios.post(apiUrl, doctor);
            console.log(`Successfully inserted: ${doctor.firstName} ${doctor.lastName}`);
        } catch (error) {
            console.error(`Error inserting doctor ${doctor.firstName} ${doctor.lastName}:`, error.response.data);
        }
    }
}

insertDoctors();
