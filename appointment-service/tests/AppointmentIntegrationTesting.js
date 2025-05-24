const assert = require('assert');
const request = require('supertest');
const app = require('../appointment-service'); // Adjust the path to your app if necessary
const nock = require('nock');
const mongoose = require("mongoose");
const Appointment = mongoose.model("Appointments");


describe('Appointment Service', function() {
    this.timeout(35000); // Set timeout to 10 seconds

    beforeEach(async () => {
        await Appointment.deleteMany({}); // Clear the Appointment collection before each test
    });

    after(() => {
        nock.cleanAll(); // Clean up all interceptors after tests
    });

    it('should measure average appointment creation time for 5 appointments', async () => {
        const numAppointment = 1; // Number of appointments to create
        const times = []; // Array to store time taken for each appointment creation

        // Mock the user-service API
        nock('http://user-service:4545')
            .get('/user/PAT-00001') // Mock the specific endpoint
            .reply(200, { _id: "6816445ce49c2e54d479fc91", name: "John Doe" }); // Mocked response

        // Mock the doctor-service API for fetching doctor details
        nock('http://doctor-service:5005')
            .get('/doctor/DOC-00001') // Mock the specific endpoint
            .reply(200, { _id: "6814c77ff0a63bbfdcadfd68", name: "Dr. Smith" }); // Mocked response

        // Mock the doctor-service API for removing availability
        nock('http://doctor-service:5005')
            .post('/removeAvailability/DOC-00001', {
                date: "2023-10-01T00:00",
                TimeSlot: "10:00"
            }) // Mock the specific endpoint and payload
            .reply(200, { message: "Slot removed successfully" }); // Mocked response

        // Mock the medical-records-service API
        nock('http://medical-records-service:5050')
            .put('/addAppointment/6816445ce49c2e54d479fc91', body => {
                // Validate the body fields
                return body.appointmentId  &&
                    body.doctorId === "6814c77ff0a63bbfdcadfd68" &&
                    body.date === "2023-10-01T00:00" &&
                    body.time === "10:00" &&
                    body.reason === "Checkup" &&
                    body.status === "Scheduled";
            })
            .reply(200, { message: "Appointment added to medical record successfully" });

        for (let i = 0; i < numAppointment; i++) {
            const newAppointment = {
                patientId: "PAT-00001",
                doctorId: "DOC-00001",
                date: "2023-10-01T00:00",
                time: "10:00",
                reason: "Checkup",
                status: "Scheduled"
            };
            const start = Date.now(); // Start time
            const response = await request(app).post('/appointment').send(newAppointment); // Use the wrapped server
            const end = Date.now(); // End time

            assert.strictEqual(response.status, 201);
            assert.strictEqual(response.body.message, "Appointment created and added to medical record");

            times.push(end - start); // Calculate and store the time taken
        }

        // Calculate average time
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        console.log(`Average appointment creation time for ${numAppointment} appointments: ${avgTime} ms`);
    });

    it('should return 400 if required fields are missing', async () => {
        const requiredFields = ["patientId", "doctorId", "date", "time", "reason", "status"];

        for (const field of requiredFields) {
            const newAppointment = {
                patientId: "PAT-00001",
                doctorId: "DOC-00001",
                date: "2023-10-01",
                time: "10:00",
                reason: "Checkup",
                status: "Scheduled"
            };

            // Remove the current field to simulate a missing field
            delete newAppointment[field];

            const response = await request(app).post('/appointment').send(newAppointment);
            assert.strictEqual(response.status, 400);
            assert.strictEqual(response.body.message, "All fields are required");
        }
    });
    it('should integrate with user-service and doctor-service and medical service', async () => {
        // Mock the user-service API
        nock('http://user-service:4545')
            .get('/user/PAT-00001') // Mock the specific endpoint
            .reply(200, { _id: "6816445ce49c2e54d479fc91", name: "John Doe" }); // Mocked response

        // Mock the doctor-service API for fetching doctor details
        nock('http://doctor-service:5005')
            .get('/doctor/DOC-00001') // Mock the specific endpoint
            .reply(200, { _id: "6814c77ff0a63bbfdcadfd68", name: "Dr. Smith" }); // Mocked response

        // Mock the doctor-service API for removing availability
        nock('http://doctor-service:5005')
            .post('/removeAvailability/DOC-00001', {
                date: "2023-10-01T00:00",
                TimeSlot: "10:00"
            }) // Mock the specific endpoint and payload
            .reply(200, { message: "Slot removed successfully" }); // Mocked response

        // Mock the medical-records-service API
        nock('http://medical-records-service:5050')
            .put('/addAppointment/6816445ce49c2e54d479fc91', body => {
                // Validate the body fields
                return body.appointmentId &&
                    body.doctorId === "6814c77ff0a63bbfdcadfd68" &&
                    body.date === "2023-10-01T00:00" &&
                    body.time === "10:00" &&
                    body.reason === "Checkup" &&
                    body.status === "Scheduled";
            })
            .reply(200, { message: "Appointment added to medical record successfully" });

        // Create a new appointment
        const newAppointment = {
            patientId: "PAT-00001",
            doctorId: "DOC-00001",
            date: "2023-10-01T00:00",
            time: "10:00",
            reason: "Checkup",
            status: "Scheduled"
        };

        // Send the request to the appointment-service
        const response = await request(app).post('/appointment').send(newAppointment);

        // Assertions
        assert.strictEqual(response.status, 201);
        assert.strictEqual(response.body.message, "Appointment created and added to medical record");

        // Verify that all mocks were called
        assert.strictEqual(nock.isDone(), true, "Not all nock interceptors were used");
    });
});