const assert = require('assert');
const request = require('supertest');
const app = require('../user-service'); // Adjust the path to your app if necessary
const nock = require('nock');
const mongoose = require("mongoose");
const User = mongoose.model("Patient");

describe('User Service', function() {
    this.timeout(35000); // Set timeout to 10 seconds

    beforeEach(async () => {
        await User.deleteMany({}); // Clear the User collection before each test
    });
    after(() => {
        nock.cleanAll();
    });

    it('should measure average user creation time for 50 users', async () => {
        const numUsers = 200; // Number of users to create
        const times = []; // Array to store time taken for each user creation

        // Mock the medical-records-service API once
        nock('http://medical-records-service:5050')
            .post('/medical-records', body => {
                console.log('Intercepted request body:', body);
                return body.patient &&
                    body.bloodType &&
                    body.weight === 70 &&
                    body.height === 175 &&
                    Array.isArray(body.emergencyContact) &&
                    Array.isArray(body.allergies) &&
                    Array.isArray(body.chronicDiseases) &&
                    Array.isArray(body.pastSurgeries) &&
                    Array.isArray(body.currentMedications) &&
                    Array.isArray(body.vaccinationRecords) &&
                    Array.isArray(body.appointments) &&
                    Array.isArray(body.diagnoses) &&
                    Array.isArray(body.treatmentPlans) &&
                    Array.isArray(body.labResults) &&
                    Array.isArray(body.radiologyReports) &&
                    body.insuranceProvider === '';
            })
            .times(numUsers+50) // Allow the mock to be used `numUsers` times
            .reply(201, { message: "Medical record created successfully" });

        for (let i = 0; i < numUsers; i++) {
            const newUser = {
                firstName: `User${i}`,
                lastName: "Test",
                dateOfBirth: "1990-01-01",
                gender: "Male",
                email: `testuser${i}@example.com`, // Unique email for each user
                phone: `12345678${i}`,
                address: {
                    city: "City",
                    aptNumber: "1A",
                    HouseNumber: "10",
                    street: "Street"
                },
                password: "password",
                weight: 70,
                height: 175,
                bloodType: "A+"
            };

            const start = Date.now(); // Start time
            const response = await request(app).post('/User').send(newUser);
            const end = Date.now(); // End time

            assert.strictEqual(response.status, 201);
            assert.strictEqual(response.body.message, "A new user and medical record have been created successfully");

            times.push(end - start); // Calculate and store the time taken
        }

        // Calculate average time
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        console.log(`Average user creation time over ${numUsers} requests: ${avgTime.toFixed(2)} ms`);
    });

    it('should return 400 if required fields are missing', async () => {
        const requiredFields = ["firstName", "lastName", "dateOfBirth", "gender", "email", "phone", "weight", "height", "bloodType"];

        for (const field of requiredFields) {
            const newUser = {
                firstName: "John",
                lastName: "Doe",
                dateOfBirth: "1990-01-01",
                gender: "Male",
                email: "johndoe@example.com",
                phone: "1234567890",
                address: {
                    city: "City",
                    aptNumber: "1A",
                    HouseNumber: "10",
                    street: "Street"
                },
                password: "password",
                weight: 70,
                height: 175,
                bloodType: "A+"
            };

            // Remove the current field to simulate a missing field
            delete newUser[field];

            const response = await request(app).post('/User').send(newUser);

            assert.strictEqual(response.status, 400);
            assert.strictEqual(response.body.error, `${field} is required.`);
        }
    });
});