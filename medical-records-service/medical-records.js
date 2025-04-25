const mongoose = require("mongoose");

const MedicalRecordSchema = new mongoose.Schema(
    {
        //Patient Info:
        patient: {type: mongoose.Schema.Types.ObjectId , required: true, ref: "Patient", unique:true},
        patientName: { type: String, required: true},
        dateOfBirth: {type: Date, required: true},
        gender: {type: String, enum: ["Male", "Female", "Other"], required: true},
        email: {type:String, required:true},
        phoneNumber:{type:String,required:true},
        address:{
            street:{type: String, required:true},
            HouseNumber:{type:String, required:true},
            aptNumber:{type:String, required:true},
            city:{type:String, required:true}
        },
        emergencyContact:[{
            name:{type:String, required:true},
            relationship:{type:String, required:true},
            phoneNumber: {type:String, required:true}
        }],

        //Medical History
        allergies:[{type:String}],
        chronicDiseases:[{type:String}],
        pastSurgeries:[{
            surgeryName:{type:String, required:true},
            date:{type:Date, required:true},
            hospital:{type:String, required:true},
            doctorInCharge:{type:mongoose.Schema.Types.ObjectId, required:true, ref:"Doctors"}
        }],

        //Current medical information
        currentMedications:[{
            medicationName:{type:String, required:true},
            dosage: {type:String, required:true},
            frequency:{type:String, required:true}
        }],
        vaccinationRecords:[{
            vaccineName:{type:String, required:true},
            vaccineDate:{type:Date, required:true}
        }],
        bloodType:{type:String, required:true},
        weight:{type:Number, required:true},
        height:{type:Number, required:true},

        //Appoitments and Treatments
        appointments:[{
            appointmentId:{type: mongoose.Schema.Types.ObjectId, required:true, ref:"Appointments"},
            doctorId:{type: mongoose.Schema.Types.ObjectId, required:true, ref:"Doctors"},
            date:{type:Date, required:true},
            time:{type:String, required:true},
            reason:{type:String},
            status:{type:String, enum:["Scheduled", "Completed", "Cancelled"], required:true}
        }],
        diagnoses:[{
            diagnosis:{type:String, required:true},
            date:{type:Date, required:true},
            doctorId: {type:mongoose.Schema.Types.ObjectId, required:true, ref:"Doctors"},
            notes:{type:String}
        }],
        treatmentPlans:[{
            treatmentName: {type:String, required:true},
            startDate:{type:Date, required:true},
            endDate: {type:Date, required:true},
            doctorId: {type: mongoose.Schema.Types.ObjectId, required:true, ref:"Doctors"},
            progressNotes:[{
                date:{type:Date, required:true},
                notes:{type:String, required:true}
            }]
        }],

        //Lab Tests and Reports
        investigations: [{
            testType: {type: String, enum: ["Lab", "Radiology"], required: true},
            testName: {type: String, required: true},
            status: {type: String, enum: ["Requested", "Approved", "Undergoing", "Completed"], default: "Requested"},
            doctorId: {type: mongoose.Schema.Types.ObjectId, ref: "Doctors",required: true},
            requestedDate: {type: Date, default: Date.now}
          }],
          
        labResults:[{
            testName: {type:String, required:true},
            date:{type:Date, required:true},
            result:{type:String, required:true},
            doctorId:{type: mongoose.Schema.Types.ObjectId, required:true, ref:"Doctors"},
            fileUrl:{type:String}
        }],
        radiologyReports:[{
            scanType:{type:String, required:true},
            date:{type:Date, required:true},
            findings:{type:String, required:true},
            fileUrl:{type:String}
        }],

        //Insurance Info
        insuranceProvider:{type:String},
        createdAt: { type: Date, default: Date.now }
    },
    { timestamps: true } // ✅ Ensure timestamps is placed here properly
  );

  MedicalRecordSchema.pre("find", function () {
    this.populate("patient");
});

  module.exports = mongoose.model("MedicalRecords", MedicalRecordSchema);