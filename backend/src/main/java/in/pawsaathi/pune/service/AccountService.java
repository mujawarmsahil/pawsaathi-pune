package in.pawsaathi.pune.service;

import in.pawsaathi.pune.model.AccountProfileResponse;
import in.pawsaathi.pune.model.UpdateAccountProfileRequest;

public interface AccountService {
    AccountProfileResponse profile(long userId);

    AccountProfileResponse updateProfile(long userId, UpdateAccountProfileRequest request);
}
