package in.pawsaathi.pune.service;

import in.pawsaathi.pune.model.CaretakerDetailResponse;
import in.pawsaathi.pune.model.CaretakerProfileRequest;
import in.pawsaathi.pune.model.CaretakerProfileResponse;
import in.pawsaathi.pune.model.CaretakerSummaryResponse;

import java.util.List;

public interface CaretakerService {
    List<CaretakerSummaryResponse> searchApproved(Long serviceId, String area);

    CaretakerDetailResponse getApproved(long caretakerId);

    CaretakerProfileResponse profile(long userId);

    CaretakerProfileResponse saveProfile(long userId, CaretakerProfileRequest request);

    int saveServices(long userId, List<Long> serviceIds);
}
