import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(
      "mongodb://dev:devpassword@mongo:27017/diningHallDB?authSource=admin",
    );

    console.log("MongoDB connected successfully!");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    throw error;
  }
};

export default connectDB;
