import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Home',
  description: 'MPE Admin',
};

export default function HomePage() {
  redirect('/login');
}
