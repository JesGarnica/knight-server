import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new Schema({
      username: {
            type: String,
            unique: true,
            lowercase: true,
            required: true,
      },
      email: {
            type: String,
            required: true,
      },
      password: {
            type: String,
            required: true,
      },
      admin: {
            type: Boolean,
            required: true,
      }
});

const User = mongoose.model("User", userSchema);

export default User;

export const UserClientFields = [
      "username",
      "email",
      "password",
      "admin",
]

/*
 * Fetch a user from the DB based on user ID.
 */
export async function getUserById(id, includePassword) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return null
      }      
      const user = await User.findOne({ _id: id}).then((user) => {
          if (user) {
              const userObj = { username: user.username, email: user.email, admin: user.admin };
              if (!includePassword) {
                  return userObj;
              }
              userObj.password = user.password;
              return userObj;
          } else {
              console.log("User not found")
              return null;
          }
      }).catch((err) => {
          console.log(err);
          return null;
      });
    return user;
}

/*
 * Fetch a user from the DB based on user ID.
 */
export async function getUserByUsername(username, includePassword) {
      const user = await User.findOne({ username: username }).then((user) => {
            console.log(user)
            if (user) {
                  const userObj = { id: user.id, username: user.username, email: user.email, admin: user.admin };
                  if (!includePassword) {
                        return userObj;
                  }
                  userObj.password = user.password;
                  return userObj;
            } else {
                  console.log("User not found")
                  return null;
            }
      }).catch((err) => {
            console.log(err);
            return null;
      });
      return user;
}

export async function validateUser(user, password) {
    return user && await bcrypt.compare(password, user.password)
}