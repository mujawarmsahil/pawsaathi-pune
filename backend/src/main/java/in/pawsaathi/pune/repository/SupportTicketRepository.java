package in.pawsaathi.pune.repository;

import in.pawsaathi.pune.entity.SupportTicket;
import in.pawsaathi.pune.entity.SupportTicketStatus;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long> {
    List<SupportTicket> findByUserIdOrderByCreatedAtDesc(long userId);

    List<SupportTicket> findAllByOrderByCreatedAtDesc();

    Optional<SupportTicket> findByIdAndUserId(long id, long userId);

    long countByStatus(SupportTicketStatus status);
}
