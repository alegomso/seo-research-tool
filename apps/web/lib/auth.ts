import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  ],

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },

  callbacks: {
    async session({ session, user }) {
      // Add user ID and role to session
      if (session?.user && user) {
        session.user.id = user.id;
        // @ts-ignore - extending session type
        session.user.role = user.role;
      }
      return session;
    },

    async jwt({ user, token }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },

    async signIn({ user, account, profile }) {
      // Check if user is allowed to sign in
      if (account?.provider === 'google') {
        const email = user.email;

        // You can add domain restrictions here
        // const allowedDomains = ['your-company.com'];
        // if (!allowedDomains.some(domain => email?.endsWith(`@${domain}`))) {
        //   return false;
        // }

        // Create user if doesn't exist
        if (email) {
          const existingUser = await prisma.user.findUnique({
            where: { email },
          });

          if (!existingUser) {
            await prisma.user.create({
              data: {
                email,
                name: user.name,
                role: 'MARKETER', // Default role
                ssoSub: account.providerAccountId,
              },
            });
          }
        }
      }

      return true;
    },
  },

  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  debug: process.env.NODE_ENV === 'development',
};