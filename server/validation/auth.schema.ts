import { z } from 'zod'

export const registerSchema = z.object({
  email: z
    .string({
      required_error: 'A valid email is required',
      invalid_type_error: 'A valid email is required',
    })
    .trim()
    .toLowerCase()
    .email('A valid email is required')
    .max(254, 'Email must be 254 characters or fewer'),
  password: z
    .string({
      required_error: 'Password must be at least 8 characters',
      invalid_type_error: 'Password must be at least 8 characters',
    })
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be 128 characters or fewer'),
})

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required', invalid_type_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .min(1, 'Email is required')
    .max(254, 'Email must be 254 characters or fewer'),
  password: z
    .string({ required_error: 'Password is required', invalid_type_error: 'Password is required' })
    .min(1, 'Password is required')
    .max(128, 'Password must be 128 characters or fewer'),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
