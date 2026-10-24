package in.pawsaathi.pune.controller;

import in.pawsaathi.pune.model.AccountProfileResponse;
import in.pawsaathi.pune.model.UpdateAccountProfileRequest;
import in.pawsaathi.pune.security.CurrentUserProvider;
import in.pawsaathi.pune.service.AccountService;

import jakarta.validation.Valid;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/account")
public class AccountController {
    private final AccountService account;
    private final CurrentUserProvider currentUser;

    public AccountController(AccountService account, CurrentUserProvider currentUser) {
        this.account = account;
        this.currentUser = currentUser;
    }

    @GetMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public AccountProfileResponse profile() {
        return account.profile(currentUser.require().id());
    }

    @PutMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public AccountProfileResponse updateProfile(
            @Valid @RequestBody UpdateAccountProfileRequest request) {
        return account.updateProfile(currentUser.require().id(), request);
    }
}
