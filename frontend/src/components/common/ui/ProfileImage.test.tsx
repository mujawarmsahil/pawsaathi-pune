import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ProfileImage } from './ProfileImage';

describe('profile image', () => {
  it('shows a silhouette placeholder when no picture is uploaded or the URL fails', () => {
    const { container, rerender } = render(<ProfileImage name="Aditi Kale" />);
    expect(
      screen.getByRole('img', { name: 'Aditi Kale profile picture not uploaded' }),
    ).toHaveClass('profile-placeholder');
    expect(container.querySelector('.profile-placeholder svg')).toBeInTheDocument();

    rerender(<ProfileImage name="Aditi Kale" src="https://example.test/broken.jpg" />);
    fireEvent.error(screen.getByRole('img', { name: 'Aditi Kale profile picture' }));
    expect(
      screen.getByRole('img', { name: 'Aditi Kale profile picture not uploaded' }),
    ).toHaveClass('profile-placeholder');
  });

  it('uses the shared demo picture when no picture is uploaded', () => {
    const { container } = render(<ProfileImage name="Asha Rao" fallbackSrc="/demo-profile.svg" />);
    expect(screen.getByRole('img', { name: 'Asha Rao profile picture' })).toHaveAttribute(
      'src',
      '/demo-profile.svg',
    );
    expect(container.querySelector('.image-skeleton')).toBeInTheDocument();
  });

  it('shows the glossy skeleton while a picture is loading', () => {
    const { container } = render(
      <ProfileImage name="Asha Rao" src="https://example.test/asha.jpg" />,
    );
    expect(container.querySelector('.image-skeleton')).toBeInTheDocument();

    fireEvent.load(screen.getByRole('img', { name: 'Asha Rao profile picture' }));

    expect(container.querySelector('.image-skeleton')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Asha Rao profile picture' })).toHaveClass(
      'profile-image-content',
    );
  });
});
