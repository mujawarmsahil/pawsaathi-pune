package in.pawsaathi.pune.service;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import in.pawsaathi.pune.exception.NotFoundException;
import in.pawsaathi.pune.mapper.ResponseMapper;
import in.pawsaathi.pune.repository.PetRepository;
import in.pawsaathi.pune.repository.UserRepository;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

@ExtendWith(MockitoExtension.class)
class PetServiceImplTest {
    @Mock PetRepository pets;
    @Mock UserRepository users;
    @Mock ResponseMapper mapper;
    @InjectMocks PetServiceImpl service;

    @Test
    void refusesToUpdatePetsThatDoNotBelongToCurrentOwner() {
        when(pets.findByIdAndOwnerIdAndDeletedAtIsNull(5L, 12L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> service.update(12L, 5L, null));
        verify(pets).findByIdAndOwnerIdAndDeletedAtIsNull(5L, 12L);
    }
}
