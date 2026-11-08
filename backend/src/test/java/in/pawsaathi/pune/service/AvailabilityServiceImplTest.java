package in.pawsaathi.pune.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import in.pawsaathi.pune.exception.BadRequestException;
import in.pawsaathi.pune.model.AvailabilitySlotRequest;
import in.pawsaathi.pune.entity.AppUser;
import in.pawsaathi.pune.repository.CaretakerAvailabilityRepository;
import in.pawsaathi.pune.repository.UserRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

class AvailabilityServiceImplTest {
    private final CaretakerAvailabilityRepository availability =
            org.mockito.Mockito.mock(CaretakerAvailabilityRepository.class);
    private final UserRepository users = org.mockito.Mockito.mock(UserRepository.class);
    private AvailabilityServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new AvailabilityServiceImpl(availability, users);
    }

    @Test
    void rejectsOverlappingSlotsBeforeReplacingExistingAvailability() {
        var slots =
                List.of(
                        new AvailabilitySlotRequest(1, LocalTime.of(9, 0), LocalTime.of(11, 0)),
                        new AvailabilitySlotRequest(1, LocalTime.of(10, 30), LocalTime.of(12, 0)));

        assertThrows(BadRequestException.class, () -> service.replaceRecurring(4L, slots));
        verifyNoInteractions(availability, users);
    }

    @Test
    void replacesNonOverlappingSlotsAtomically() {
        var caretaker = new AppUser();
        caretaker.setId(4L);
        when(users.findById(4L)).thenReturn(Optional.of(caretaker));
        when(availability.saveAll(anyList())).thenAnswer(invocation -> invocation.getArgument(0));

        int saved =
                service.replaceRecurring(
                        4L,
                        List.of(
                                new AvailabilitySlotRequest(
                                        2, LocalTime.of(13, 0), LocalTime.of(14, 0)),
                                new AvailabilitySlotRequest(
                                        2, LocalTime.of(9, 0), LocalTime.of(10, 0))));

        assertEquals(2, saved);
        verify(availability).deleteByCaretakerIdAndWeekdayIsNotNull(4L);
        verify(availability).saveAll(anyList());
    }

    @Test
    void blocksFutureDatesIdempotentlyAndAllowsUnblocking() {
        var caretaker = new AppUser();
        caretaker.setId(4L);
        var date = LocalDate.now(ZoneId.of("Asia/Kolkata")).plusDays(2);
        when(users.findById(4L)).thenReturn(Optional.of(caretaker));
        when(availability.existsByCaretakerIdAndUnavailableDateAndAvailableFalse(4L, date))
                .thenReturn(false, true);

        service.blockDate(4L, date);
        service.blockDate(4L, date);
        service.unblockDate(4L, date);

        verify(availability).save(org.mockito.ArgumentMatchers.any());
        verify(availability).deleteByCaretakerIdAndUnavailableDateAndAvailableFalse(4L, date);
    }

    @Test
    void rejectsPastUnavailableDates() {
        var date = LocalDate.now(ZoneId.of("Asia/Kolkata")).minusDays(1);

        assertThrows(BadRequestException.class, () -> service.blockDate(4L, date));
        verifyNoInteractions(availability, users);
    }
}
