import mongoose from "mongoose";

const reviewSchema = mongoose.Schema(
    {
        id: { type: Number, required: true, unique: true },
        name: { type: String, required: true },
        image: { type: String, required: true },
        description: { type: String, required: true },
    }
);

const Category = mongoose.model("Category", reviewSchema);

export default Category;