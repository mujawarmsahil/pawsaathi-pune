import { useQuery } from '@tanstack/react-query';
import { NavLink } from 'react-router-dom';

import { endpoints } from '../../api/endpoints';
import demoProfilePhoto from '../../assets/demo-profile.svg';
import { useAuthContext } from '../../hooks/useAuthContext';
import { ProfileImage } from '../common/ui/ProfileImage';

type ProfileIconLinkProps = {
  to: string;
};

export function ProfileIconLink({ to }: ProfileIconLinkProps) {
  const { user } = useAuthContext();
  const profile = useQuery({
    queryKey: ['account', 'profile'],
    queryFn: endpoints.account.profile,
  });

  return (
    <NavLink className="profile-icon-link" to={to} aria-label="Profile" title="Profile">
      {profile.isPending ? (
        <span className="image-skeleton profile-icon-loading" aria-hidden="true" />
      ) : (
        <ProfileImage
          className="profile-icon-avatar"
          src={profile.data?.photoUrl}
          name={profile.data?.name ?? user?.name ?? 'Your'}
          fallbackSrc={demoProfilePhoto}
          loading="eager"
        />
      )}
    </NavLink>
  );
}
