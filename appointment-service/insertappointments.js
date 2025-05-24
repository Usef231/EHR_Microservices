const axios = require('axios');
const fs = require('fs');
const path = require('path');
const mongoose = require("mongoose");
require("./appointments");
const Appointments = mongoose.model("Appointments");
mongoose.connect("mongodb+srv://YoussefSeyam:Admin@userservice.8lohq.mongodb.net/UserService");


const AppointmentsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'appointments.json'), 'utf8'));

const apiUrl = "http://localhost:4000/appointment"; 

async function insertAppointments() {
    await Appointments.deleteMany({});
    for (let appointment of AppointmentsData) {
        try {
            const response = await axios.post(apiUrl, appointment);
            console.log(`Successfully inserted`);
        } catch (error) {
            console.error(`Error inserting doctor`, error.response.data);
        }
    }
}

insertAppointments();
