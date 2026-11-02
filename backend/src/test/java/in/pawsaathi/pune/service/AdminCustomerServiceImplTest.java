package in.pawsaathi.pune.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import in.pawsaathi.pune.entity.AdminAction;
import in.pawsaathi.pune.entity.AppUser;
import in.pawsaathi.pune.entity.AuditLog;
import in.pawsaathi.pune.entity.Booking;
import in.pawsaathi.pune.entity.Pet;
import in.pawsaathi.pune.exception.BadRequestException;
import in.pawsaathi.pune.exception.NotFoundException;
import in.pawsaathi.pune.repository.AdminActionRepository;
import in.pawsaathi.pune.repository.AuditLogRepository;
import in.pawsaathi.pune.repository.BookingRepository;
import in.pawsaathi.pune.repository.PetRepository;
import in.pawsaathi.pune.repository.RefreshTokenRepository;
import in.pawsaathi.pune.repository.UserRepository;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

class AdminCustomerServiceImplTest {

    private final UserRepository users = mock(UserRepository.class);
    private final PetRepository pets = mock(PetRepository.class);
    private final BookingRepository bookings = mock(BookingRepository.class);
    private final AdminActionRepository adminActions = mock(AdminActionRepository.class);
    private final AuditLogRepository auditLogs = mock(AuditLogRepository.class);
    private final RefreshTokenRepository refreshTokens = mock(RefreshTokenRepository.class);
    private final AdminCustomerServiceImpl service =
            new AdminCustomerServiceImpl(
                    users, pets, bookings, adminActions, auditLogs, refreshTokens);

    @Test
    void listsCustomersWithPetsAndLatestBookingArea() {
        AppUser riya = customer(1L, "Riya Deshmukh", "ACTIVE");
        AppUser dev = customer(2L, "Dev Shah", "DEACTIVATED");
        Pet bruno = pet(10L, riya, "Bruno", "Dog", "Golden Retriever");
        Pet coco = pet(11L, riya, "Coco", "Cat", null);
        Booking latest = booking(riya, "Baner, Pune");
        Booking older = booking(riya, "Aundh, Pune");

        when(users.findAdminCustomers()).thenReturn(List.of(riya, dev));
        when(pets.findByOwnerIdInAndDeletedAtIsNullOrderByName(List.of(1L, 2L)))
                .thenReturn(List.of(bruno, coco));
        when(bookings.findCustomerLocations(List.of(1L, 2L))).thenReturn(List.of(latest, older));

        var responses = service.customers();

        assertEquals(2, responses.size());
        assertEquals("Riya Deshmukh", responses.getFirst().name());
        assertEquals("Baner, Pune", responses.getFirst().area());
        assertEquals(2, responses.getFirst().pets().size());
        assertEquals("Bruno", responses.getFirst().pets().getFirst().name());
        assertEquals("Golden Retriever", responses.getFirst().pets().getFirst().breed());
        assertEquals("DEACTIVATED", responses.get(1).status());
        assertNull(responses.get(1).area());
        assertEquals(List.of(), responses.get(1).pets());
    }

    @Test
    void rejectsUnknownCustomerStatus() {
        assertThrows(
                BadRequestException.class,
                () -> service.updateStatus(99L, 1L, "SUSPENDED"));

        verify(users, never()).save(any());
        verify(adminActions, never()).save(any());
    }

    @Test
    void deactivatesCustomerAndRevokesSessions() {
        AppUser admin = mock(AppUser.class);
        AppUser customer = customer(1L, "Riya Deshmukh", "ACTIVE");
        when(users.findById(99L)).thenReturn(Optional.of(admin));
        when(users.findLockedById(1L)).thenReturn(Optional.of(customer));

        var response = service.updateStatus(99L, 1L, "deactivated");

        assertEquals("DEACTIVATED", response.status());
        verify(customer).setStatus("DEACTIVATED");
        verify(users).save(customer);
        verify(refreshTokens).revokeAllForUser(anyLong(), any(Instant.class));
        verify(adminActions).save(any(AdminAction.class));
        verify(auditLogs).save(any(AuditLog.class));
    }

    @Test
    void reactivatesCustomerWithoutRevokingSessions() {
        AppUser admin = mock(AppUser.class);
        AppUser customer = customer(1L, "Riya Deshmukh", "DEACTIVATED");
        when(users.findById(99L)).thenReturn(Optional.of(admin));
        when(users.findLockedById(1L)).thenReturn(Optional.of(customer));

        var response = service.updateStatus(99L, 1L, "ACTIVE");

        assertEquals("ACTIVE", response.status());
        verify(customer).setStatus("ACTIVE");
        verify(refreshTokens, never()).revokeAllForUser(anyLong(), any(Instant.class));
    }

    @Test
    void leavesUnchangedStatusUntouched() {
        AppUser admin = mock(AppUser.class);
        AppUser customer = customer(1L, "Riya Deshmukh", "ACTIVE");
        when(users.findById(99L)).thenReturn(Optional.of(admin));
        when(users.findLockedById(1L)).thenReturn(Optional.of(customer));

        var response = service.updateStatus(99L, 1L, "ACTIVE");

        assertEquals("ACTIVE", response.status());
        verify(users, never()).save(customer);
        verify(adminActions, never()).save(any());
    }

    @Test
    void rejectsMissingCustomer() {
        when(users.findAdminCustomerById(404L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> service.customerDetail(404L));
    }

    private AppUser customer(long id, String name, String status) {
        AppUser customer = mock(AppUser.class);
        when(customer.getId()).thenReturn(id);
        when(customer.getName()).thenReturn(name);
        when(customer.getEmail()).thenReturn(name.toLowerCase().replace(' ', '.') + "@example.test");
        when(customer.getStatus()).thenReturn(status);
        when(customer.roleName()).thenReturn("CUSTOMER");
        when(customer.getCreatedAt()).thenReturn(Instant.parse("2026-08-14T10:00:00Z"));
        when(customer.getUpdatedAt()).thenReturn(Instant.parse("2026-09-02T10:00:00Z"));
        return customer;
    }

    private Pet pet(
            long id, AppUser owner, String name, String species, String breed) {
        Pet pet = mock(Pet.class);
        when(pet.getId()).thenReturn(id);
        when(pet.getOwner()).thenReturn(owner);
        when(pet.getName()).thenReturn(name);
        when(pet.getSpecies()).thenReturn(species);
        when(pet.getBreed()).thenReturn(breed);
        when(pet.getAgeYears()).thenReturn(new BigDecimal("3.5"));
        return pet;
    }

    private Booking booking(AppUser customer, String location) {
        Booking booking = mock(Booking.class);
        when(booking.getCustomer()).thenReturn(customer);
        when(booking.getLocation()).thenReturn(location);
        return booking;
    }
}
