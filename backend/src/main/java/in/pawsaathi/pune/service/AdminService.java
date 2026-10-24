package in.pawsaathi.pune.service;

import in.pawsaathi.pune.model.AdminBookingDetailResponse;
import in.pawsaathi.pune.model.AdminBookingSummaryResponse;
import in.pawsaathi.pune.model.AdminCaretakerDetailResponse;
import in.pawsaathi.pune.model.AdminDecisionResponse;
import in.pawsaathi.pune.model.AdminOverviewResponse;
import in.pawsaathi.pune.model.CaretakerCandidateResponse;

import java.util.List;

public interface AdminService {
    AdminOverviewResponse overview();

    List<CaretakerCandidateResponse> caretakers();

    AdminCaretakerDetailResponse caretakerDetail(long caretakerId);

    List<AdminBookingSummaryResponse> caretakerBookings(long caretakerId);

    AdminBookingDetailResponse bookingDetail(long bookingId);

    AdminDecisionResponse reviewCaretaker(long adminId, long caretakerId, String status);
}
