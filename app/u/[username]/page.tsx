import { redirect } from 'next/navigation';

export default function UsernameRedirect({ params }: { params: { username: string } }) {
  redirect(`/profile/${params.username}`);
}
