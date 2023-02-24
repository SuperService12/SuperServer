import express from "express";
import asyncHandler from "express-async-handler";


import Product from "./../Models/ProductModel.js";
import Category from "./../Models/CategoryModel.js";
import { admin, protect, vendor } from "./../Middleware/AuthMiddleware.js";

const productRoute = express.Router();

// GET ALL PRODUCT
productRoute.get(
  "/",
  asyncHandler(async (req, res) => {
    const pageSize = 12;
    const page = Number(req.query.pageNumber) || 1;
    const keyword = req.query.keyword
      ? {
        name: {
          $regex: req.query.keyword,
          $options: "i",
        },
      }
      : {};
    const count = await Product.countDocuments({ ...keyword });
    const products = await Product.find({ ...keyword })
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .sort({ _id: -1 });
    res.json({ products, page, pages: Math.ceil(count / pageSize) });
  })
);

// GET ALL PRODUCT By Category Id
productRoute.get(
  "/category/:id",
  asyncHandler(async (req, res) => {
    const products = await Product.find({ cId: req.params.id })
    console.log('products c', products, req.params.id);
    res.json(products);
  })
);

// GET ALL CATEGORY
productRoute.get(
  "/category",
  asyncHandler(async (req, res) => {
    const category = await Category.find({});
    res.json(category);
  })
);

// ADMIN GET ALL PRODUCT WITHOUT SEARCH AND PEGINATION
productRoute.get(
  "/all",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const products = await Product.find({}).sort({ _id: -1 });
    res.json(products);
  })
);

// ADMIN GET ALL PRODUCT WITHOUT SEARCH AND PEGINATION
productRoute.get(
  "/by/:id",
  protect,
  vendor,
  asyncHandler(async (req, res) => {
    const products = await Product.find({ by: req.params.id }).sort({ _id: -1 });
    res.json(products);
  })
);
// GET SINGLE PRODUCT
productRoute.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404);
      throw new Error("Product not Found");
    }
  })
);

// PRODUCT REVIEW
productRoute.post(
  "/:id/review",
  protect,
  asyncHandler(async (req, res) => {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (product) {
      const alreadyReviewed = product.reviews.find(
        (r) => r.user.toString() === req.user._id.toString()
      );
      if (alreadyReviewed) {
        res.status(400);
        throw new Error("Product already Reviewed");
      }
      const review = {
        name: req.user.name,
        rating: Number(rating),
        comment,
        user: req.user._id,
      };

      product.reviews.push(review);
      product.numReviews = product.reviews.length;
      product.rating =
        product.reviews.reduce((acc, item) => item.rating + acc, 0) /
        product.reviews.length;

      await product.save();
      res.status(201).json({ message: "Reviewed Added" });
    } else {
      res.status(404);
      throw new Error("Product not Found");
    }
  })
);

// DELETE PRODUCT
productRoute.delete(
  "/:id",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (product) {
      await product.remove();
      res.json({ message: "Product deleted" });
    } else {
      res.status(404);
      throw new Error("Product not Found");
    }
  })
);

// CREATE PRODUCT
productRoute.post(
  "/",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const { name, price, description, image, countInStock, category } = req.body;
    const productExist = await Product.findOne({ name });

    let cValue = await Category.findOne({ id: category })
    let categoryObject = {
      id: cValue.id,
      name: cValue.name,
      image: cValue.image,
      description: cValue.description,
      category: cValue._id,
    }

    if (productExist) {
      res.status(400);
      throw new Error("Product name already exist");
    } else {
      const product = new Product({
        name,
        by: req.user._id,
        price,
        description,
        image,
        countInStock,
        user: req.user._id,
        category: categoryObject,
        cId: category,
      });
      if (product) {
        const createdproduct = await product.save();
        res.status(201).json(createdproduct);
      } else {
        res.status(400);
        throw new Error("Invalid product data");
      };
    }
  }
  ));

// UPDATE PRODUCT
productRoute.put(
  "/:id",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const { name, price, description, time, category } = req.body;
    const product = await Product.findById(req.params.id);
    console.log('cate', category);
    if (product) {
      product.name = name || product.name;
      product.price = price || product.price;
      product.description = description || product.description;
      // product.image = image || product.image;
      product.time = time || product.time;
      if (product.cId && product.cId !== category) {
        let cValue = await Category.findOne({ id: category })
        let categoryObject = {
          id: cValue.id,
          name: cValue.name,
          image: cValue.image,
          description: cValue.description,
          category: cValue._id,
        }
        product.category = categoryObject;
      }
      product.cId = category || product.cId;

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404);
      throw new Error("Product not found");
    }
  })
);

// CREATE PRODUCT CATEGORY
productRoute.post(
  "/category",
  asyncHandler(async (req, res) => {
    const { id, name, image, description } = req.body;
    const categoryExist = await Category.findOne({ name });

    if (categoryExist) {
      res.status(400);
      throw new Error("Category name already exist");
    } else {
      const category = new Category({
        id,
        name,
        description,
        image,
      });
      if (category) {
        const createdCategory = await category.save();
        res.status(201).json(createdCategory);
      } else {
        res.status(400);
        throw new Error("Invalid product data");
      };
    }
  })
);
export default productRoute;
