const axios = require('axios');
const fs = require('fs');
const path = require('path');
const mongoose = require("mongoose");
require("./users");
const Users = mongoose.model("Patient");
mongoose.connect("mongodb+srv://YoussefSeyam:Admin@userservice.8lohq.mongodb.net/UserService");


const userData = JSON.parse(fs.readFileSync(path.join(__dirname, 'users.json'), 'utf8'));

const apiUrl = "http://localhost:4545/User"; 

async function insertUsers() {
    await Users.deleteMany({});
    for (let user of userData) {
        try {
            const response = await axios.post(apiUrl, user);
            console.log(`Successfully inserted: ${user.firstName} ${user.lastName}`);
        } catch (error) {
            console.error(`Error inserting doctor ${user.firstName} ${user.lastName}:`, error.response.data);
        }
    }
}

insertUsers();
