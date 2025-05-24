const mongoose = require('mongoose');

// Replace with your MongoDB connection string
const mongoURI = "mongodb+srv://YoussefSeyam:Admin@userservice.8lohq.mongodb.net/UserService";

// Define the schema and model for the medical records
const medicalRecordSchema = new mongoose.Schema({}, { strict: false }); // Flexible schema
const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);

async function clearDatabase() {
    try {
        // Connect to the database
        await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("Connected to the database.");

        // Delete all documents in the collection
        const result = await MedicalRecord.deleteMany({});
        console.log(`Deleted ${result.deletedCount} documents from the medical records collection.`);

        // Close the connection
        await mongoose.disconnect();
        console.log("Disconnected from the database.");
    } catch (err) {
        console.error("Error clearing the database:", err);
    }
}

// Run the script
clearDatabase();