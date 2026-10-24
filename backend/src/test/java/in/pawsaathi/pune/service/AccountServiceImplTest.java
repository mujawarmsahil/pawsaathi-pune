package in.pawsaathi.pune.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import in.pawsaathi.pune.entity.AppUser;
import in.pawsaathi.pune.entity.AuditLog;
import in.pawsaathi.pune.entity.RoleEntity;
import in.pawsaathi.pune.exception.BadRequestException;
import in.pawsaathi.pune.exception.ConflictException;
import in.pawsaathi.pune.model.UpdateAccountProfileRequest;
import in.pawsaathi.pune.repository.AuditLogRepository;
import in.pawsaathi.pune.repository.UserRepository;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;

@ExtendWith(MockitoExtension.class)
class AccountServiceImplTest {
    @Mock UserRepository users;
    @Mock AuditLogRepository auditLogs;
    @InjectMocks AccountServiceImpl service;

    @Test
    void returnsAccountDetailsForTheCurrentUser() {
        AppUser user = user();
        when(users.findById(7L)).thenReturn(Optional.of(user));

        var profile = service.profile(7L);

        assertEquals("Riya Deshmukh", profile.name());
        assertEquals("riya@example.test", profile.email());
        assertEquals("9876543210", profile.phone());
        assertNull(profile.photoUrl());
        assertEquals("CUSTOMER", profile.role());
        assertEquals("ACTIVE", profile.status());
        assertEquals(Instant.parse("2026-01-02T03:04:05Z"), profile.createdAt());
    }

    @Test
    void trimsAndNormalizesEditableProfileFields() {
        AppUser user = user();
        when(users.findById(7L)).thenReturn(Optional.of(user));
        when(users.existsByEmail("new@example.test")).thenReturn(false);
        when(users.saveAndFlush(user)).thenReturn(user);

        var profile =
                service.updateProfile(
                        7L,
                        new UpdateAccountProfileRequest(
                                "  Riya S. Deshmukh  ",
                                "  New@Example.Test ",
                                "   ",
                                "data:image/jpeg;base64,aGVsbG8="));

        assertEquals("Riya S. Deshmukh", profile.name());
        assertEquals("new@example.test", profile.email());
        assertNull(profile.phone());
        assertEquals("data:image/jpeg;base64,aGVsbG8=", profile.photoUrl());
        verify(auditLogs).save(any(AuditLog.class));
    }

    @Test
    void rejectsAnEmailOwnedByAnotherAccount() {
        AppUser user = user();
        when(users.findById(7L)).thenReturn(Optional.of(user));
        when(users.existsByEmail("taken@example.test")).thenReturn(true);

        assertThrows(
                ConflictException.class,
                () ->
                        service.updateProfile(
                                7L,
                                new UpdateAccountProfileRequest(
                                        "Riya Deshmukh", "taken@example.test", null, null)));

        verify(users, never()).saveAndFlush(any());
    }

    @Test
    void rejectsAnInvalidProfilePicture() {
        AppUser user = user();
        when(users.findById(7L)).thenReturn(Optional.of(user));

        assertThrows(
                BadRequestException.class,
                () ->
                        service.updateProfile(
                                7L,
                                new UpdateAccountProfileRequest(
                                        "Riya Deshmukh",
                                        "riya@example.test",
                                        null,
                                        "https://example.test/photo.png")));

        verify(users, never()).saveAndFlush(any());
    }

    private AppUser user() {
        RoleEntity role = new RoleEntity();
        role.setName("CUSTOMER");
        AppUser user = new AppUser();
        user.setId(7L);
        user.setName("Riya Deshmukh");
        user.setEmail("riya@example.test");
        user.setPhone("9876543210");
        user.setRole(role);
        user.setStatus("ACTIVE");
        user.setCreatedAt(Instant.parse("2026-01-02T03:04:05Z"));
        user.setUpdatedAt(Instant.parse("2026-02-03T04:05:06Z"));
        return user;
    }
}
