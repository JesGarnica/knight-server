import mongoose from "mongoose";

let connection = null;

async function connectToDb() {
  if (connection) return connection;
  /*
   * Change the URI below by editing the .env file
   * My credentials may not work for you, so you should replace them.
   */
  connection = await mongoose.connect(
    `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}/${process.env.MONGO_DB_NAME}`
  );

  if (connection)
    console.log("[⚡️ server]: Successfully connected to MongoDB.");
  else console.log("[⚡️ server]: Failed to connect to MongoDB.");

  return connection;
}

export default connectToDb;
