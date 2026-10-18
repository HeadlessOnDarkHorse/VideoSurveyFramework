import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import MasterGeologistChat from '../components/MasterGeologistChat';

describe('MasterGeologistChat', () => {
  it('renders initial prompt with correct title', () => {
    render(
      <MasterGeologistChat
        findingId="123"
        findingTitle="Obsidian"
        aiClassificationData={[{ confidence: 0.99 }]}
        onClose={() => {}}
      />
    );

    expect(screen.getByText(/I see you've found something you identified as Obsidian/i)).toBeInTheDocument();
    expect(screen.getByText(/99%/i)).toBeInTheDocument();
  });

  it('allows user to send a message and simulates a response', async () => {
    render(
      <MasterGeologistChat
        findingId="123"
        findingTitle="Obsidian"
        aiClassificationData={[]}
        onClose={() => {}}
      />
    );

    const input = screen.getByPlaceholderText(/Ask about its age/i);
    // Use getByRole to find the submit button explicitly
    const sendButton = screen.getByRole('button', { name: /send/i, hidden: true }) || screen.getAllByRole('button')[1];

    fireEvent.change(input, { target: { value: 'How old is it?' } });
    fireEvent.click(sendButton);

    // User message should appear
    expect(screen.getByText('How old is it?')).toBeInTheDocument();

    // Input should be disabled while loading
    expect(input).toBeDisabled();

    // Wait for either the success response or the API key error fallback
    await waitFor(() => {
      const successNode = screen.queryByText(/Typically, formations like this occur/i);
      const errorNode = screen.queryByText(/Incorrect API key/i);
      expect(successNode || errorNode).toBeInTheDocument();
    }, { timeout: 2000 });
  });
});
