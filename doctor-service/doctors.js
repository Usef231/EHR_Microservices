const mongoose = require("mongoose");

const DoctorSchema = new mongoose.Schema(
    {
       doctorId: {type: String, unique: true, sparse:true},
       firstName: {type: String, required: true},
       lastName: {type: String, required: true},
       gender:{type: String, enum:["male","Female"], required: true},
       email: {type:String, required:true, unique:true},
       password:{type:String, required:true},
       specialization: {type:String, required:true},
       licenseNumber:{type:String, required:true, unique:true},
       phoneNumber: {type:String},
       experienceYears: {type: Number, required: true},
       workingHours: {type: Map, of:String, default:{}},
       availability: [{
        date: {type: Date, required: true},
        TimeSlots: [String]
       }],
       reviews: [
        {
            patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient"},
            patientName: {type:String, required:true},
            rating: { type: Number, min:1, max:5},
            comment: {type: String}
        }
       ],
       averageRating: { type: Number, default: 0 }
    },
    { timestamps: true } // ✅ Ensure timestamps is placed here properly
  );

  const generateAvailability = (start, end) => {
    let slots = [];
    let [startHour, startMin] = start.split(":").map(Number);
    let [endHour, endMin] = end.split(":").map(Number);

    while (startHour < endHour || (startHour === endHour && startMin < endMin)) {
      
        let time = `${String(startHour).padStart(2, "0")}:${String(startMin).padStart(2, "0")}`;
   
        slots.push(time);
        startMin += 30; // 30-minute interval
        if (startMin >= 60) {
            startHour += 1;
            startMin -= 60;
        }
    }
    return slots;
};

DoctorSchema.pre("save", function (next) {
    if(this.isNew){
        const today = new Date();
        const availability = [];

        for (let i = 0; i < 7; i++) { // Generate availability for the next 7 days
            const date = new Date(today);
            date.setDate(today.getDate() + i);

            availability.push({
                date: date.toISOString().split("T")[0], // YYYY-MM-DD format
                TimeSlots: generateAvailability("09:00", "17:00"),
            });
        }

        this.availability = availability;
        
    }
    next();
});

  module.exports = mongoose.model("Doctors", DoctorSchema);
