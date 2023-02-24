const express =  require("express");
const dotenv =  require("dotenv");
const cors =  require("cors");

const connectDatabase =  require("./config/MongoDb.js");
const productRoute =  require("./Routes/ProductRoutes.js");
const { errorHandler, notFound } =  require("./Middleware/Errors.js");
const userRouter =  require("./Routes/UserRoutes.js");
const orderRouter =  require("./Routes/orderRoutes.js");

dotenv.config();
connectDatabase();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));
app.use(express.static("files"));

// API
app.get('/get', (req, res) => {
  console.log('object');
  res.send('loo1')
})
app.use("/api/products", productRoute);
app.use("/api/users", userRouter);
app.use("/api/orders", orderRouter);
app.get("/api/config/paypal", (req, res) => {
  res.send(process.env.PAYPAL_CLIENT_ID);
});

// ERROR HANDLER
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 1000;

app.listen(PORT, console.log(`server run in port ${PORT}`));
