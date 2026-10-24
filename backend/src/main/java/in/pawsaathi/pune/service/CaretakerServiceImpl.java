package in.pawsaathi.pune.service;

import in.pawsaathi.pune.entity.AppUser;
import in.pawsaathi.pune.entity.CaretakerProfile;
import in.pawsaathi.pune.entity.ServiceArea;
import in.pawsaathi.pune.entity.ServiceCatalogItem;
import in.pawsaathi.pune.exception.BadRequestException;
import in.pawsaathi.pune.exception.NotFoundException;
import in.pawsaathi.pune.model.CaretakerDetailResponse;
import in.pawsaathi.pune.model.CaretakerProfileRequest;
import in.pawsaathi.pune.model.CaretakerProfileResponse;
import in.pawsaathi.pune.model.CaretakerSummaryResponse;
import in.pawsaathi.pune.repository.CaretakerProfileRepository;
import in.pawsaathi.pune.repository.CaretakerQueryRepository;
import in.pawsaathi.pune.repository.ServiceAreaRepository;
import in.pawsaathi.pune.repository.ServiceCatalogRepository;
import in.pawsaathi.pune.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class CaretakerServiceImpl implements CaretakerService {
    private final CaretakerQueryRepository query;
    private final CaretakerProfileRepository profiles;
    private final UserRepository users;
    private final ServiceAreaRepository areas;
    private final ServiceCatalogRepository services;

    public CaretakerServiceImpl(
            CaretakerQueryRepository query,
            CaretakerProfileRepository profiles,
            UserRepository users,
            ServiceAreaRepository areas,
            ServiceCatalogRepository services) {
        this.query = query;
        this.profiles = profiles;
        this.users = users;
        this.areas = areas;
        this.services = services;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CaretakerSummaryResponse> searchApproved(Long serviceId, String area) {
        String normalizedArea = area == null || area.isBlank() ? null : area.trim();
        return query.searchApproved(serviceId, normalizedArea);
    }

    @Override
    @Transactional(readOnly = true)
    public CaretakerDetailResponse getApproved(long caretakerId) {
        return query.findApproved(caretakerId)
                .orElseThrow(() -> new NotFoundException("Caretaker not found."));
    }

    @Override
    @Transactional(readOnly = true)
    public CaretakerProfileResponse profile(long userId) {
        return query.findProfile(userId)
                .orElseThrow(() -> new NotFoundException("Caretaker profile not found."));
    }

    @Override
    @Transactional
    public CaretakerProfileResponse saveProfile(
            long userId, CaretakerProfileRequest request) {
        List<String> areaNames = splitCsv(request.serviceAreas());
        if (areaNames.isEmpty()) {
            throw new BadRequestException("Select at least one service area.");
        }
        Map<String, Long> areaIdsByName =
                areas.findByActiveTrueOrderByNameAsc().stream()
                        .collect(
                                Collectors.toMap(
                                        area -> area.getName().toLowerCase(Locale.ROOT),
                                        ServiceArea::getId,
                                        (first, second) -> first));
        List<Long> areaIds = resolveIds(areaNames, areaIdsByName, "area");
        List<String> serviceNames =
                request.serviceTypes() == null ? List.of() : splitCsv(request.serviceTypes());
        Map<String, Long> serviceIdsByName =
                services.findByActiveTrueOrderByIdAsc().stream()
                        .collect(
                                Collectors.toMap(
                                        service -> service.getName().toLowerCase(Locale.ROOT),
                                        ServiceCatalogItem::getId,
                                        (first, second) -> first));
        List<Long> serviceIds = resolveIds(serviceNames, serviceIdsByName, "service");

        AppUser user =
                users.findById(userId)
                        .orElseThrow(() -> new NotFoundException("Caretaker not found."));
        CaretakerProfile profile =
                profiles.findByUserId(userId).orElseGet(() -> CaretakerProfile.pending(user));
        profile.setBio(clean(request.bio()));
        profile.setExperienceYears(request.experienceYears());
        profile.setHourlyRate(request.hourlyRate());
        profile.setLanguages(clean(request.languages()));
        profiles.saveAndFlush(profile);
        query.replaceAreas(userId, areaIds);
        query.replaceServices(userId, serviceIds, request.hourlyRate());
        return profile(userId);
    }

    @Override
    @Transactional
    public int saveServices(long userId, List<Long> serviceIds) {
        if (serviceIds == null || serviceIds.isEmpty()) {
            throw new BadRequestException("Select at least one service.");
        }
        List<Long> ids = new ArrayList<>(new LinkedHashSet<>(serviceIds));
        Map<Long, ServiceCatalogItem> available =
                services.findAllById(ids).stream()
                        .filter(ServiceCatalogItem::isActive)
                        .collect(Collectors.toMap(ServiceCatalogItem::getId, Function.identity()));
        if (available.size() != ids.size()) {
            throw new BadRequestException("One selected service is unavailable.");
        }
        CaretakerProfile profile =
                profiles.findByUserId(userId)
                        .orElseThrow(() -> new NotFoundException("Caretaker profile not found."));
        query.replaceServices(userId, ids, profile.getHourlyRate());
        return ids.size();
    }

    private static List<String> splitCsv(String value) {
        if (value == null) {
            return List.of();
        }
        return Arrays.stream(value.split(","))
                .map(String::trim)
                .filter(item -> !item.isBlank())
                .distinct()
                .toList();
    }

    private static List<Long> resolveIds(
            List<String> names, Map<String, Long> idsByName, String resource) {
        List<Long> ids = new ArrayList<>();
        for (String name : names) {
            Long id = idsByName.get(name.toLowerCase(Locale.ROOT));
            if (id == null) {
                throw new BadRequestException("Unknown " + resource + ": " + name);
            }
            ids.add(id);
        }
        return ids.stream().distinct().toList();
    }

    private static String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
