
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login successful');
    navigate('/'); 
  };

  return (
    <div className="flex min-h-screen">
      <div className="w-1/2 bg-gradient-to-b from-blue-500 to-blue-700 flex flex-col items-center justify-center text-white p-10">
        <img src="/idm-logo.png" alt="IDM Logo" className="w-48 mb-6" />
        <h1 className="text-4xl font-bold">IDM</h1>
      </div>

      <div className="w-1/2 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-semibold mb-2">Login</h2>
          <p className="mb-6 text-gray-500">Sign in to continue</p>

          <form onSubmit={handleSubmit}>
            <label className="block text-sm text-gray-600 mb-1">EMAIL:</label>
            <input
              type="email"
              placeholder="example@example.com"
              className="w-full mb-4 px-4 py-3 bg-gray-100 rounded-full outline-none"
              required
            />

            <label className="block text-sm text-gray-600 mb-1">PASSWORD:</label>
            <input
              type="password"
              placeholder="*************"
              className="w-full mb-2 px-4 py-3 bg-gray-100 rounded-full outline-none"
              required
            />

            <div className="text-right text-sm text-gray-400 mb-6 cursor-pointer hover:underline">
              Forgot password?
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-400 to-blue-600 text-white font-semibold py-2 rounded-full hover:from-blue-500 hover:to-blue-700 transition"
            >
              login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
