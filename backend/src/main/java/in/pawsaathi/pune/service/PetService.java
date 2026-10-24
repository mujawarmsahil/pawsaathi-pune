package in.pawsaathi.pune.service;

import in.pawsaathi.pune.model.PetRequest;
import in.pawsaathi.pune.model.PetResponse;

import java.util.List;

public interface PetService {
    List<PetResponse> listForOwner(long ownerId);

    PetResponse create(long ownerId, PetRequest request);

    PetResponse update(long ownerId, long petId, PetRequest request);

    void delete(long ownerId, long petId);
}
