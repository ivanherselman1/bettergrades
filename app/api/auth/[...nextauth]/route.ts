// app/api/auth/[...nextauth]/route.ts

import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import connectToDatabase from "@/lib/mongodb";
import User, { UserDocument } from "@/models/User";
import { Model } from "mongoose";
import mongoose from "mongoose"; // Added import for mongoose

export const authOptions: AuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await connectToDatabase();
        
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const UserModel = User as Model<UserDocument>;
        const user = await UserModel.findOne({ username: credentials.username }).exec();
        
        if (user && await bcrypt.compare(credentials.password, user.password)) {
          return { 
            id: (user._id as mongoose.Types.ObjectId).toString(),
            name: user.username 
          };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
