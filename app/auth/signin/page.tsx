// app/auth/signin/page.tsx

'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

function SignInPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await signIn('credentials', {
      username,
      password,
      callbackUrl: '/', // Redirect after successful sign-in
    });
  };

  return (
    <div>
      <h1>Sign In</h1>
      <form onSubmit={handleSignIn} method="post">
        <div>
          <label htmlFor="username">Username:</label>
          <input
            id="username"
            name="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        <button type="submit">Sign In</button>
      </form>
    </div>
  );
}

export default SignInPage;
