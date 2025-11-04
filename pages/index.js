import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the family page by default
    router.push('/family.html');
  }, []);

  return null;
}