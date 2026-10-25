package in.pawsaathi.pune.service;

import in.pawsaathi.pune.exception.NotFoundException;
import in.pawsaathi.pune.mapper.ResponseMapper;
import in.pawsaathi.pune.model.PetRequest;
import in.pawsaathi.pune.model.PetResponse;
import in.pawsaathi.pune.entity.Pet;
import in.pawsaathi.pune.repository.PetRepository;
import in.pawsaathi.pune.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class PetServiceImpl implements PetService {
    private final PetRepository pets;
    private final UserRepository users;
    private final ResponseMapper responseMapper;

    public PetServiceImpl(PetRepository pets, UserRepository users, ResponseMapper responseMapper) {
        this.pets = pets;
        this.users = users;
        this.responseMapper = responseMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public List<PetResponse> listForOwner(long ownerId) {
        return pets.findByOwnerIdAndDeletedAtIsNullOrderByCreatedAtDesc(ownerId).stream()
                .map(responseMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public PetResponse create(long ownerId, PetRequest request) {
        var owner =
                users.findById(ownerId)
                        .orElseThrow(() -> new NotFoundException("Account not found."));
        Pet pet =
                pets.save(
                        new Pet(
                                owner,
                                request.name().trim(),
                                request.species().trim(),
                                clean(request.breed()),
                                request.ageYears(),
                                clean(request.notes()),
                                clean(request.foodNotes()),
                                clean(request.photoUrl())));
        return responseMapper.toResponse(pet);
    }

    @Override
    @Transactional
    public PetResponse update(long ownerId, long petId, PetRequest request) {
        Pet pet = ownedPet(ownerId, petId);
        pet.update(
                request.name().trim(),
                request.species().trim(),
                clean(request.breed()),
                request.ageYears(),
                clean(request.notes()),
                clean(request.foodNotes()),
                clean(request.photoUrl()));
        return responseMapper.toResponse(pets.save(pet));
    }

    @Override
    @Transactional
    public void delete(long ownerId, long petId) {
        ownedPet(ownerId, petId).softDelete(Instant.now());
    }

    private Pet ownedPet(long ownerId, long petId) {
        return pets.findByIdAndOwnerIdAndDeletedAtIsNull(petId, ownerId)
                .orElseThrow(() -> new NotFoundException("Pet not found."));
    }

    private String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
