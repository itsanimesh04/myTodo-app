import 'next-auth'
import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface User {
    id?: string
    theme?: string
    houseId?: string | null
    houseName?: string | null
    [key: string]: unknown
  }

  interface Session {
    user: {
      id: string
      theme?: string
      houseId?: string | null
      houseName?: string | null
      [key: string]: unknown
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    theme?: string
    houseId?: string | null
    houseName?: string | null
  }
}
