const express = require("express");
const asyncHandler = require("express-async-handler");

const { admin, protect, vendor } = require("../Middleware/AuthMiddleware.js");
const Order = require("./../Models/OrderModel.js");

const orderRouter = express.Router();

// CREATE ORDER
orderRouter.post(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    } = req.body;

    if (orderItems && orderItems.length === 0) {
      res.status(400);
      throw new Error("No order items");
    } else {
      var now = new Date();
      var vendors = orderItems.map((item) => {
        return item.by;
      })
      const order = new Order({
        orderItems,
        user: req.user._id,
        shippingAddress,
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        scheduledDate: now.getTime(),
        scheduledTime: now.getTime(),
        vendors
      });
      const createOrder = await order.save();
      res.status(201).json(createOrder);
    }
  })
);

// ADMIN GET ALL ORDERS
orderRouter.get(
  "/all",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const orders = await Order.find({})
      .sort({ _id: -1 })
      .populate("user", "id name email");
    res.json(orders);
  })
);
// VENDOR GET HIS ORDERS
orderRouter.get(
  "/by/:id",
  protect,
  vendor,
  asyncHandler(async (req, res) => {
    const orders = await Order.find({ vendors: req.params.id })
      .sort({ _id: -1 })
      .populate("user", "id name email");

    if (!orders) {
      res.status(401);
      return res.json({ status: 401, message: "There is no order" });
    }

    if (orders.length === 0) {
      res.status(251);
      return res.json({ status: 251, message: "There is no your order", orders: [] });
    }
    orders.forEach((order) => {
      order.orderItems = order.orderItems.filter((product) => { return product.by === req.params.id })
      order.vendors = undefined;
      if (order.orderItems === 0) {
        return order.totalPrice = order.orderItems[0].qty * order.orderItems[0].price;
      }
      let sum = 0; order.orderItems.forEach((o) => sum += o.qty * o.price)
      order.totalPrice = sum
    })

    res.json({ status: 200, orders });
  })
);
// USER LOGIN ORDERS
orderRouter.get(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const order = await Order.find({ user: req.user._id }).sort({ _id: -1 });
    res.json(order);
  })
);

// GET ORDER BY ID
orderRouter.get(
  "/by/:byId/:id",
  protect,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate(
      "user",
      "name email"
    );

    order.orderItems = order.orderItems.filter((product) => { return product.by === req.params.byId })
    order.vendors = undefined;
    let sum = 0;
    sum = (order.orderItems === 0) ?
      order.orderItems[0].qty * order.orderItems[0].price :
      order.orderItems.forEach((o) => sum += o.qty * o.price);
    order.totalPrice = sum

    if (order) {
      res.json(order);
    } else {
      res.status(404);
      throw new Error("Order Not Found");
    }
  })
);
// GET ORDER BY ID
orderRouter.get(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate(
      "user",
      "name email"
    );

    if (order) {
      res.json(order);
    } else {
      res.status(404);
      throw new Error("Order Not Found");
    }
  })
);
// ORDER IS PAID
orderRouter.put(
  "/:id/pay",
  protect,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: req.body.id,
        status: req.body.status,
        update_time: req.body.update_time,
        email_address: req.body.email_address,
      };

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404);
      throw new Error("Order Not Found");
    }
  })
);

// ORDER IS PAID
orderRouter.put(
  "/:id/delivered",
  protect,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
      order.isPaid = true;
      order.status = 3;//Delivered

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404);
      throw new Error("Order Not Found");
    }
  })
);

// ORDER STATUS UPDATE
orderRouter.put(
  "/:id/status",
  protect,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order && req.body.status) {
      order.status = req.body.status || 0;

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404);
      throw new Error("Order Not Found");
    }
  })
);

module.exports = orderRouter;
