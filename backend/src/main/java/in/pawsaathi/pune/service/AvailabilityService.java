package in.pawsaathi.pune.service;

import in.pawsaathi.pune.model.AvailabilitySlotRequest;
import in.pawsaathi.pune.model.AvailabilitySlotResponse;

import java.util.List;

public interface AvailabilityService {
    List<AvailabilitySlotResponse> listRecurring(long caretakerId);

    int replaceRecurring(long caretakerId, List<AvailabilitySlotRequest> slots);
}
