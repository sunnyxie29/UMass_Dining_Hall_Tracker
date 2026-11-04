import mongoose from "mongoose";
const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  diningHallId: {
    type: Number,
    required: true,
  },
  section: {
    type: String,
    required: true,
  },
});
const MenuItem = mongoose.model("MenuItem", menuItemSchema);
export default MenuItem;
