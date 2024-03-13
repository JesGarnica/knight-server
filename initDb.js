/*
 * This file contains a simple script to populate the database with initial
 * data from the files in the data/ directory.
 */
import User, { UserClientFields } from "./models/user.js";

/* 
* This is a workaround because we're using ES6 modules instead of CommonJS
* Node 17.5+ also forces import assertions, which not everyone may be using.
* However, it still works the same.
*/
import fs from "fs";
const usersData = JSON.parse(fs.readFileSync("./data/users.json"));

import mongoose from "mongoose";
import connectToDb from "./lib/mongosose.js";

async function populateDb() {
  await connectToDb();

  console.log(
    `
    --------------------------------------------------------
    [initDb ⚡️]: Deleting all documents from all collections. 
    \t  (Modify initDb.js to change this behavior) 
    --------------------------------------------------------
    `
  );

  console.log(
    `
    --------------------------------------------------------
    [initDb ⚡️]: Populating database with data "./data" ...
    --------------------------------------------------------
    `
  );

  const collections = [
    {
      model: User,
      data: usersData,
      clientFields: UserClientFields,
    }
  ];

  let createdUsers = [];
  let usersCount = 0;

  for (const collection of collections) {
    const { model, data, clientFields, ownerIdField, userIdField } = collection;

    await model.deleteMany({});

    const documents = data.map((document) => {
      let documentObj = {};

      clientFields.map((field) => {
        documentObj[field] = document[field];

        if (model === User) {
          if (field === "admin") {
            documentObj[field] = documentObj[field] === "true";
          }
        }
      });

      documentObj["_id"] = new mongoose.Types.ObjectId();
      return documentObj;
    });

    const createdDocuments = await model.create(documents);

    if (model === User) {
      createdUsers = createdDocuments;
      usersCount = createdUsers.length;
    }
  }

  console.log(
    `
    --------------------------------------------------------
    [initDb ⚡️]: Database populated successfully.
    --------------------------------------------------------
    `
  );
}

export default populateDb;
