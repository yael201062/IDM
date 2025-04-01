import React, { useState } from 'react';

type AuthFormProps = {
  onSubmit: (email: string, password: string) => void;
};

const AuthForm: React.FC<AuthFormProps> = ({ onSubmit }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email, password);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white shadow-md rounded px-8 pt-6 pb-8 w-full max-w-sm"
    >
      <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>

      <div className="mb-4">
        <label className="block text-gray-700 text-sm mb-2">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
        />
      </div>

      <div className="mb-6">
        <label className="block text-gray-700 text-sm mb-2">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
        />
      </div>

      <button
        type="submit"
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
      >
        Login
      </button>
    </form>
  );
};

export default AuthForm;
