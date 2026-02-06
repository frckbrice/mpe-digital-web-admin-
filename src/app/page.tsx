import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Home',
  description: 'DB Digital Agency',
};

export default function HomePage() {
  redirect('/login');
}
