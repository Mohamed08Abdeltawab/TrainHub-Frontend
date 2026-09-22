import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid Email!' }),
  password: z.string().min(6, { message: 'The password must be at least 6 characters long.' }),
})