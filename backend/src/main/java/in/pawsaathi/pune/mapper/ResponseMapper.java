package in.pawsaathi.pune.mapper;

import in.pawsaathi.pune.entity.Booking;
import in.pawsaathi.pune.entity.PaymentStatus;
import in.pawsaathi.pune.entity.Pet;
import in.pawsaathi.pune.entity.Review;
import in.pawsaathi.pune.model.BookingResponse;
import in.pawsaathi.pune.model.PetResponse;

import org.springframework.stereotype.Component;

@Component
public class ResponseMapper {
    public BookingResponse toResponse(Booking booking) {
        return toResponse(booking, null);
    }

    public BookingResponse toResponse(Booking booking, PaymentStatus paymentStatus) {
        return toResponse(booking, paymentStatus, null);
    }

    public BookingResponse toResponse(
            Booking booking, PaymentStatus paymentStatus, Review review) {
        return new BookingResponse(
                booking.getId(),
                booking.getCustomer().getId(),
                booking.getCaretaker().getId(),
                booking.getPet().getId(),
                booking.getService().getId(),
                booking.getStartsAt(),
                booking.getEndsAt(),
                booking.getStatus(),
                paymentStatus,
                booking.getCancellationReason(),
                review == null ? null : review.getRating(),
                review == null ? null : review.getComment(),
                booking.getHourlyRate(),
                booking.getLocation(),
                booking.getNotes(),
                booking.getService().getName(),
                booking.getPet().getName(),
                booking.getCustomer().getName(),
                booking.getCaretaker().getName(),
                booking.getCustomer().getEmail(),
                booking.getCustomer().getPhone(),
                booking.getCaretaker().getEmail(),
                booking.getCaretaker().getPhone(),
                booking.getCustomer().getPhotoUrl(),
                booking.getCaretaker().getPhotoUrl(),
                booking.getPet().getPhotoUrl(),
                booking.getPet().getSpecies(),
                booking.getPet().getBreed(),
                booking.getPet().getAgeYears(),
                booking.getPet().getNotes(),
                booking.getPet().getFoodNotes());
    }

    public PetResponse toResponse(Pet pet) {
        return new PetResponse(
                pet.getId(),
                pet.getName(),
                pet.getSpecies(),
                pet.getBreed(),
                pet.getAgeYears(),
                pet.getNotes(),
                pet.getFoodNotes(),
                pet.getPhotoUrl());
    }
}
