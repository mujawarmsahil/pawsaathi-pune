package in.pawsaathi.pune.service;

import in.pawsaathi.pune.exception.BadRequestException;
import in.pawsaathi.pune.exception.NotFoundException;
import in.pawsaathi.pune.model.AvailabilitySlotRequest;
import in.pawsaathi.pune.model.AvailabilitySlotResponse;
import in.pawsaathi.pune.entity.CaretakerAvailability;
import in.pawsaathi.pune.repository.CaretakerAvailabilityRepository;
import in.pawsaathi.pune.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.List;

@Service
public class AvailabilityServiceImpl implements AvailabilityService {
    private static final ZoneId SERVICE_ZONE = ZoneId.of("Asia/Kolkata");

    private final CaretakerAvailabilityRepository availability;
    private final UserRepository users;

    public AvailabilityServiceImpl(
            CaretakerAvailabilityRepository availability, UserRepository users) {
        this.availability = availability;
        this.users = users;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AvailabilitySlotResponse> listRecurring(long caretakerId) {
        return availability
                .findByCaretakerIdAndWeekdayIsNotNullAndAvailableTrueOrderByWeekdayAscStartsAtAsc(
                        caretakerId)
                .stream()
                .map(
                        slot ->
                                new AvailabilitySlotResponse(
                                        slot.getId(),
                                        slot.getWeekday(),
                                        slot.getStartsAt(),
                                        slot.getEndsAt()))
                .toList();
    }

    @Override
    @Transactional
    public int replaceRecurring(long caretakerId, List<AvailabilitySlotRequest> slots) {
        if (slots == null || slots.size() > 42) {
            throw new BadRequestException(
                    "Availability must contain no more than 42 slots.");
        }
        var sorted =
                slots.stream()
                        .sorted(
                                Comparator.comparingInt(AvailabilitySlotRequest::weekday)
                                        .thenComparing(AvailabilitySlotRequest::startsAt))
                        .toList();
        AvailabilitySlotRequest previous = null;
        for (var slot : sorted) {
            if (!slot.endsAt().isAfter(slot.startsAt())) {
                throw new BadRequestException(
                        "Each availability end time must follow its start time.");
            }
            if (previous != null
                    && previous.weekday() == slot.weekday()
                    && slot.startsAt().isBefore(previous.endsAt())) {
                throw new BadRequestException(
                        "Availability slots for the same day cannot overlap.");
            }
            previous = slot;
        }
        var caretaker =
                users.findById(caretakerId)
                        .orElseThrow(() -> new NotFoundException("Caretaker not found."));
        availability.deleteByCaretakerIdAndWeekdayIsNotNull(caretakerId);
        availability.saveAll(
                sorted.stream()
                        .map(
                                slot ->
                                        CaretakerAvailability.recurring(
                                                caretaker,
                                                slot.weekday(),
                                                slot.startsAt(),
                                                slot.endsAt()))
                        .toList());
        return sorted.size();
    }

    @Override
    @Transactional(readOnly = true)
    public List<LocalDate> listBlockedDates(long caretakerId) {
        return availability
                .findByCaretakerIdAndUnavailableDateIsNotNullAndAvailableFalseOrderByUnavailableDateAsc(
                        caretakerId)
                .stream()
                .map(CaretakerAvailability::getUnavailableDate)
                .distinct()
                .toList();
    }

    @Override
    @Transactional
    public void blockDate(long caretakerId, LocalDate date) {
        if (date.isBefore(LocalDate.now(SERVICE_ZONE))) {
            throw new BadRequestException("Unavailable dates must be today or in the future.");
        }
        var caretaker =
                users.findById(caretakerId)
                        .orElseThrow(() -> new NotFoundException("Caretaker not found."));
        if (!availability.existsByCaretakerIdAndUnavailableDateAndAvailableFalse(
                caretakerId, date)) {
            availability.save(CaretakerAvailability.blockedDate(caretaker, date));
        }
    }

    @Override
    @Transactional
    public void unblockDate(long caretakerId, LocalDate date) {
        availability.deleteByCaretakerIdAndUnavailableDateAndAvailableFalse(caretakerId, date);
    }
}
