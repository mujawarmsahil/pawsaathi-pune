package in.pawsaathi.pune.model;

public record AdminOverviewResponse(
        long customers,
        long caretakers,
        long pendingCaretakers,
        long bookings,
        long openTickets) {}
