const { buildSchema } = require("graphql");
const bcrypt = require("bcrypt");
const UserService = require("../services/userService");
const { generateToken } = require("../middleware/auth");

// Define GraphQL schema
const schema = buildSchema(`
  type User {
    username: String!
    email: String!
    isActivated: Boolean!
    createdAt: String!
    updatedAt: String!
}
    type AuthResult {
    token: String!
    user: User!
    message: String!
  }
    type Query {
    users: [User!]!
    user(username: String!): User
  }
    type Mutation {
    register( username: String!, email: String!, password: String!): AuthResult!
    login( username: String!, password: String!): AuthResult!
  }
`);

// Define GraphQL resolvers
const root = {
  // queries
  users: async () => {
    return await UserService.getAllUsers();
  },
  user: async ({ username }) => {
    return await UserService.findUserByUsername(username);
  },
  // mutations
  register: async ({ username: desiredUsername, email, password }) => {
    // Skopiuj walidację z userRegister.js
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email format");
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(password)) {
      throw new Error(
        "Password must be at least 8 characters long and contain at least one letter and one number"
      );
    }

    const username = await UserService.generateUniqueUsername(desiredUsername);
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await UserService.addUser({
      username,
      email,
      password: hashedPassword,
    });

    const token = generateToken(newUser);

    return {
      token,
      user: newUser,
      message: "User registered successfully",
    };
  },

  login: async ({ email, password }) => {
    const user = await UserService.findUserByEmail(email);
    if (!user) {
      throw new Error("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    const token = generateToken(user);

    return {
      token,
      user,
      message: "Login successful",
    };
  },
};
module.exports = {
  schema,
  root,
};
