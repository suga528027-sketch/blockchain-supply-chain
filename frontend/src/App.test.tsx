import React from 'react';
import { render, screen } from '@testing-library/react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';

test('renders the authentication screen', () => {
  render(
    <GoogleOAuthProvider clientId="test-client-id">
      <App />
    </GoogleOAuthProvider>
  );

  expect(screen.getByText(/authentication/i)).toBeInTheDocument();
});
