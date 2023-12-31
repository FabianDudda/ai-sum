import { connectMongoDB } from "@/lib/mongodb";
import User from "@/models/user";
import NextAuth from "next-auth/next";
import GoogleProvider from "next-auth/providers/google";

const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async session({ session }) {
      const sessionUser = await User.findOne({ email: session.user.email });
      console.log(sessionUser);
      // set session.user._id to _id found in mongoDB "users" with session.user.email
      session.user._id = sessionUser._id;
      session.user.credits = sessionUser.credits;

      return session;
    },
    async signIn({ user, account }) {
      // console.log("USER: ", user);
      // console.log("ACCOUNT: ", account);

      if (account.provider === "google") {
        const { name, email, id } = user;

        try {
          await connectMongoDB();
          const userExists = await User.findOne({ email });

          if (!userExists) {
            const credits = 0;

            const res = await fetch("http://localhost:3000/api/users", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                name,
                email,
                credits,
                googleId: id,
              }),
            });

            if (res.ok) {
              return user;
            }
          }
        } catch (error) {
          console.log(error);
        }
      }

      return user;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
