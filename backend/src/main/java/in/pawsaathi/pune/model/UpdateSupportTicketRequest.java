package in.pawsaathi.pune.model;

import in.pawsaathi.pune.entity.SupportTicketStatus;

import jakarta.validation.constraints.NotNull;

public record UpdateSupportTicketRequest(@NotNull SupportTicketStatus status) {}
