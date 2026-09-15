import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email as string
        const password = credentials.password as string

        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            houseMembers: {
              include: { house: true },
              take: 1,
            },
          },
        })

        if (!user) return null

        const isValid = await compare(password, user.passwordHash)
        if (!isValid) return null

        const houseMembership = user.houseMembers[0]

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.avatar,
          theme: user.theme,
          houseId: houseMembership?.houseId || null,
          houseName: houseMembership?.house?.name || null,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.theme = user.theme as string | undefined
        token.houseId = user.houseId as string | null | undefined
        token.houseName = user.houseName as string | null | undefined
      }

      // Handle session updates (e.g., after joining a house)
      if (trigger === 'update' && session) {
        if (session.houseId !== undefined) token.houseId = session.houseId
        if (session.houseName !== undefined) token.houseName = session.houseName
        if (session.theme !== undefined) token.theme = session.theme
        if (session.name !== undefined) token.name = session.name
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) || session.user.id
        session.user.theme = token.theme as string | undefined
        session.user.houseId = token.houseId as string | null | undefined
        session.user.houseName = token.houseName as string | null | undefined
      }
      return session
    },
  },
})
