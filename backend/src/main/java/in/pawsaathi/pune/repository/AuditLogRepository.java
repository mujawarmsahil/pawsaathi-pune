package in.pawsaathi.pune.repository;

import in.pawsaathi.pune.entity.AuditLog;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {}
