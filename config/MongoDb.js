const mongoose = require("mongoose");

//LocalHost Config
// const connectDatabase = async () => {
//   try {
//     const conn = await mongoose.connect(process.env.MONGO_URL, {
//       useUnifiedTopology: true,
//       useNewUrlParser: true,
//     });

//     console.log(`MongoDB Connected`);
//   } catch (error) {
//     console.error(`Error: ${error.message}`);
//     process.exit(1);
//   }
// };

const username = "uc55788";
const password = "loZr5SiFeITv3y9Y";
const cluster = "urban.yfnh5qk";
const dbname = "uc";

const uri =
`mongodb+srv://${username}:${password}@${cluster}.mongodb.net/${dbname}?retryWrites=true&w=majority`;

async function connectDatabase() {
  try {
    await mongoose.connect(
      uri,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
    console.log("Connected to MongoDB");

    //verification
    const db = mongoose.connection;
    db.on("error", console.error.bind(console, "connection error: "));
    db.once("open", function () {
      console.log("Connected successfully");
    });

  } catch (error) {
    console.error(error);
  }
}

module.exports = connectDatabase;
