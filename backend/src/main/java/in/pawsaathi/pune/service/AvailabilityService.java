package in.pawsaathi.pune.service;

import in.pawsaathi.pune.model.AvailabilitySlotRequest;
import in.pawsaathi.pune.model.AvailabilitySlotResponse;

import java.time.LocalDate;
import java.util.List;

public interface AvailabilityService {
    List<AvailabilitySlotResponse> listRecurring(long caretakerId);

    int replaceRecurring(long caretakerId, List<AvailabilitySlotRequest> slots);

    List<LocalDate> listBlockedDates(long caretakerId);

    void blockDate(long caretakerId, LocalDate date);

    void unblockDate(long caretakerId, LocalDate date);
}
