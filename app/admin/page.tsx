import { redirect } from 'next/navigation'

export default function AdminRootRedirect() {
  // Assim que o usuário cair aqui, joga ele para o dashboard
  redirect('/admin/dashboard')
}