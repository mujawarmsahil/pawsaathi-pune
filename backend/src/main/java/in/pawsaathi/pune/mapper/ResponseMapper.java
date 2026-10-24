package in.pawsaathi.pune.mapper;

import in.pawsaathi.pune.entity.Booking;
import in.pawsaathi.pune.entity.Pet;
import in.pawsaathi.pune.model.BookingResponse;
import in.pawsaathi.pune.model.PetResponse;

import org.springframework.stereotype.Component;

@Component
public class ResponseMapper {
    public BookingResponse toResponse(Booking booking) {
        return new BookingResponse(
                booking.getId(),
                booking.getCustomer().getId(),
                booking.getCaretaker().getId(),
                booking.getPet().getId(),
                booking.getService().getId(),
                booking.getStartsAt(),
                booking.getEndsAt(),
                booking.getStatus(),
                booking.getHourlyRate(),
                booking.getLocation(),
                booking.getNotes(),
                booking.getService().getName(),
                booking.getPet().getName(),
                booking.getCustomer().getName(),
                booking.getCaretaker().getName());
    }

    public PetResponse toResponse(Pet pet) {
        return new PetResponse(
                pet.getId(),
                pet.getName(),
                pet.getSpecies(),
                pet.getBreed(),
                pet.getAgeYears(),
                pet.getNotes(),
                pet.getPhotoUrl());
    }
}
