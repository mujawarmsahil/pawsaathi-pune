package in.pawsaathi.pune.controller;

import in.pawsaathi.pune.model.PetRequest;
import in.pawsaathi.pune.model.PetResponse;
import in.pawsaathi.pune.security.CurrentUserProvider;
import in.pawsaathi.pune.service.PetService;

import jakarta.validation.Valid;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/pets")
@PreAuthorize("hasRole('CUSTOMER')")
public class PetController {
    private final PetService pets;
    private final CurrentUserProvider currentUser;

    public PetController(PetService pets, CurrentUserProvider currentUser) {
        this.pets = pets;
        this.currentUser = currentUser;
    }

    @GetMapping
    public List<PetResponse> list() {
        return pets.listForOwner(currentUser.require().id());
    }

    @PostMapping
    public PetResponse create(@Valid @RequestBody PetRequest request) {
        return pets.create(currentUser.require().id(), request);
    }

    @PutMapping("/{id}")
    public PetResponse update(@PathVariable long id, @Valid @RequestBody PetRequest request) {
        return pets.update(currentUser.require().id(), id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable long id) {
        pets.delete(currentUser.require().id(), id);
    }
}
