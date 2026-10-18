import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import { pb } from '../lib/pocketbase';

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const TestSetup = () => (
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route path="/sign-in" element={<div data-testid="login-page">Login Page</div>} />
        <Route path="/protected" element={
          <ProtectedRoute>
            <div data-testid="protected-content">Secret Data</div>
          </ProtectedRoute>
        } />
      </Routes>
    </MemoryRouter>
  );

  it('redirects to sign-in if the user is not authenticated', () => {
    (pb.authStore as any).isValid = false;

    render(<TestSetup />);

    expect(screen.getByTestId('login-page')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('renders the children if the user is authenticated', () => {
    (pb.authStore as any).isValid = true;

    render(<TestSetup />);

    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });
});
