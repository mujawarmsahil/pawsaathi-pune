package in.pawsaathi.pune.service;

import in.pawsaathi.pune.model.AdminCustomerResponse;
import in.pawsaathi.pune.model.AdminCustomerStatusResponse;

import java.util.List;

public interface AdminCustomerService {
    List<AdminCustomerResponse> customers();

    AdminCustomerResponse customerDetail(long customerId);

    AdminCustomerStatusResponse updateStatus(long adminId, long customerId, String status);
}
