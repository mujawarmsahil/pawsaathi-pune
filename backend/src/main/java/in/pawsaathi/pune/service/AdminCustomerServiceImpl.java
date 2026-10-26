package in.pawsaathi.pune.service;

import in.pawsaathi.pune.entity.AdminAction;
import in.pawsaathi.pune.entity.AppUser;
import in.pawsaathi.pune.entity.AuditLog;
import in.pawsaathi.pune.entity.Booking;
import in.pawsaathi.pune.entity.Pet;
import in.pawsaathi.pune.exception.BadRequestException;
import in.pawsaathi.pune.exception.NotFoundException;
import in.pawsaathi.pune.model.AdminCustomerPetResponse;
import in.pawsaathi.pune.model.AdminCustomerResponse;
import in.pawsaathi.pune.model.AdminCustomerStatusResponse;
import in.pawsaathi.pune.repository.AdminActionRepository;
import in.pawsaathi.pune.repository.AuditLogRepository;
import in.pawsaathi.pune.repository.BookingRepository;
import in.pawsaathi.pune.repository.PetRepository;
import in.pawsaathi.pune.repository.RefreshTokenRepository;
import in.pawsaathi.pune.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AdminCustomerServiceImpl implements AdminCustomerService {
    private static final Set<String> CUSTOMER_STATUSES = Set.of("ACTIVE", "DEACTIVATED");

    private final UserRepository users;
    private final PetRepository pets;
    private final BookingRepository bookings;
    private final AdminActionRepository adminActions;
    private final AuditLogRepository auditLogs;
    private final RefreshTokenRepository refreshTokens;

    public AdminCustomerServiceImpl(
            UserRepository users,
            PetRepository pets,
            BookingRepository bookings,
            AdminActionRepository adminActions,
            AuditLogRepository auditLogs,
            RefreshTokenRepository refreshTokens) {
        this.users = users;
        this.pets = pets;
        this.bookings = bookings;
        this.adminActions = adminActions;
        this.auditLogs = auditLogs;
        this.refreshTokens = refreshTokens;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminCustomerResponse> customers() {
        return responses(users.findAdminCustomers());
    }

    @Override
    @Transactional(readOnly = true)
    public AdminCustomerResponse customerDetail(long customerId) {
        AppUser customer =
                users.findAdminCustomerById(customerId)
                        .orElseThrow(() -> new NotFoundException("Customer not found."));
        return responses(List.of(customer)).getFirst();
    }

    @Override
    @Transactional
    public AdminCustomerStatusResponse updateStatus(long adminId, long customerId, String status) {
        String nextStatus =
                status == null ? "" : status.trim().toUpperCase(Locale.ROOT);
        if (!CUSTOMER_STATUSES.contains(nextStatus)) {
            throw new BadRequestException("Choose ACTIVE or DEACTIVATED.");
        }
        AppUser admin =
                users.findById(adminId)
                        .orElseThrow(() -> new NotFoundException("Admin account not found."));
        AppUser customer =
                users.findLockedById(customerId)
                        .filter(user -> "CUSTOMER".equals(user.roleName()))
                        .filter(user -> user.getDeletedAt() == null)
                        .orElseThrow(() -> new NotFoundException("Customer not found."));
        if (nextStatus.equalsIgnoreCase(customer.getStatus())) {
            return new AdminCustomerStatusResponse(customerId, nextStatus);
        }
        customer.setStatus(nextStatus);
        users.save(customer);
        if ("DEACTIVATED".equals(nextStatus)) {
            refreshTokens.revokeAllForUser(customerId, Instant.now());
        }
        adminActions.save(
                new AdminAction(
                        admin, "CUSTOMER_" + nextStatus, "CUSTOMER", customerId, null));
        auditLogs.save(
                new AuditLog(admin, "CUSTOMER_" + nextStatus, "CUSTOMER", customerId));
        return new AdminCustomerStatusResponse(customerId, nextStatus);
    }

    private List<AdminCustomerResponse> responses(List<AppUser> customers) {
        if (customers.isEmpty()) return List.of();
        List<Long> customerIds = customers.stream().map(AppUser::getId).toList();
        Map<Long, List<AdminCustomerPetResponse>> petsByCustomer =
                pets.findByOwnerIdInAndDeletedAtIsNullOrderByName(customerIds).stream()
                        .collect(
                                Collectors.groupingBy(
                                        pet -> pet.getOwner().getId(),
                                        Collectors.mapping(this::toPetResponse, Collectors.toList())));
        Map<Long, String> areaByCustomer = new HashMap<>();
        for (Booking booking : bookings.findCustomerLocations(customerIds)) {
            areaByCustomer.putIfAbsent(
                    booking.getCustomer().getId(), booking.getLocation().trim());
        }
        return customers.stream()
                .map(
                        customer ->
                                new AdminCustomerResponse(
                                        customer.getId(),
                                        customer.getName(),
                                        customer.getEmail(),
                                        customer.getPhone(),
                                        customer.getPhotoUrl(),
                                        customer.getStatus(),
                                        areaByCustomer.get(customer.getId()),
                                        customer.getCreatedAt(),
                                        customer.getUpdatedAt(),
                                        petsByCustomer.getOrDefault(customer.getId(), List.of())))
                .toList();
    }

    private AdminCustomerPetResponse toPetResponse(Pet pet) {
        return new AdminCustomerPetResponse(
                pet.getId(),
                pet.getName(),
                pet.getSpecies(),
                pet.getBreed(),
                pet.getAgeYears(),
                pet.getNotes(),
                pet.getFoodNotes(),
                pet.getPhotoUrl());
    }
}
