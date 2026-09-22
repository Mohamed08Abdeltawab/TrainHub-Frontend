import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema } from '../validators/authValidator'

export default function Login() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = (data) => {
    console.log('Form Data:', data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>Email</label>
        <input 
          type="email" 
          {...register('email')} 
          style={{
            display: 'block', 
            width: '100%', 
            maxWidth: '300px', 
            padding: '10px', 
            margin: '5px 0 15px 0', 
            border: '1px solid #ccc', 
            borderRadius: '4px',
            backgroundColor: '#fff'
          }} 
/>        {errors.email && <span style={{color: 'red'}}>{errors.email.message}</span>}
      </div>
      <div>
        <label>Password</label>
        <input 
          type="email" 
          {...register('password')} 
          style={{
            display: 'block', 
            width: '100%', 
            maxWidth: '300px', 
            padding: '10px', 
            margin: '5px 0 15px 0', 
            border: '1px solid #ccc', 
            borderRadius: '4px',
            backgroundColor: '#fff'
          }} 
/>        {errors.password && <span style={{color: 'red'}}>{errors.password.message}</span>}
      </div>
      <button type="submit" style={{marginTop: '10px', padding: '8px 15px', border: '1px solid black' , cursor:'pointer'}}>Login</button>
    </form>
  )
}