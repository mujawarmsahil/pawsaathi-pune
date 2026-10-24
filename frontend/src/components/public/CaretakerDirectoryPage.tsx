import { ArrowRight, MapPin, ShieldCheck, Star } from 'lucide-react';
import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { useAreas, useCaretakers, useServices } from '../../hooks/useCaretakerData';
import { useDebounce } from '../../hooks/useDebounce';
import { formatINR } from '../../utils';
import { EmptyState, ErrorState, LoadingState } from '../common/feedback/FeedbackStates';
import { ProfileImage } from '../common/ui/ProfileImage';

export function CaretakerDirectoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') ?? '';
  const debouncedSearchQuery = useDebounce(searchQuery);
  const directoryFilters = useMemo(() => {
    const filterParams = new URLSearchParams(searchParams);
    filterParams.delete('q');
    if (debouncedSearchQuery) filterParams.set('q', debouncedSearchQuery);
    return filterParams;
  }, [debouncedSearchQuery, searchParams]);
  const servicesQuery = useServices();
  const areasQuery = useAreas();
  const caretakersQuery = useCaretakers(directoryFilters);
  return (
    <main className="page-main">
      <section className="listing-intro container">
        <p className="eyebrow">Find your local saathi</p>
        <h1>
          Meet caring people
          <br />
          <span>in your corner.</span>
        </h1>
        <p>
          Choose a service and neighbourhood to explore approved caretakers who fit your pet’s day.
        </p>
      </section>
      <section className="container results-area">
        <div className="filters">
          <label htmlFor="filter-service">
            Service
            <select
              id="filter-service"
              value={searchParams.get('serviceId') ?? ''}
              onChange={(event) =>
                setSearchParams((currentSearchParams) => {
                  const nextSearchParams = new URLSearchParams(currentSearchParams);
                  if (event.target.value) nextSearchParams.set('serviceId', event.target.value);
                  else nextSearchParams.delete('serviceId');
                  return nextSearchParams;
                })
              }
            >
              <option value="">All services</option>
              {servicesQuery.data?.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </label>
          <label htmlFor="filter-area">
            Neighbourhood
            <select
              id="filter-area"
              value={searchParams.get('area') ?? ''}
              onChange={(event) =>
                setSearchParams((currentSearchParams) => {
                  const nextSearchParams = new URLSearchParams(currentSearchParams);
                  if (event.target.value) nextSearchParams.set('area', event.target.value);
                  else nextSearchParams.delete('area');
                  return nextSearchParams;
                })
              }
            >
              <option value="">All Pune areas</option>
              {areasQuery.data?.map((area) => (
                <option key={area.id} value={area.name}>
                  {area.name}
                </option>
              ))}
            </select>
          </label>
          <label htmlFor="filter-price">
            Maximum rate
            <input
              id="filter-price"
              type="number"
              min="0"
              placeholder="Any"
              value={searchParams.get('maxPrice') ?? ''}
              onChange={(event) =>
                setSearchParams((currentSearchParams) => {
                  const nextSearchParams = new URLSearchParams(currentSearchParams);
                  if (event.target.value) nextSearchParams.set('maxPrice', event.target.value);
                  else nextSearchParams.delete('maxPrice');
                  return nextSearchParams;
                })
              }
            />
          </label>
          <label htmlFor="filter-rating">
            Minimum rating
            <select
              id="filter-rating"
              value={searchParams.get('minRating') ?? ''}
              onChange={(event) =>
                setSearchParams((currentSearchParams) => {
                  const nextSearchParams = new URLSearchParams(currentSearchParams);
                  if (event.target.value) nextSearchParams.set('minRating', event.target.value);
                  else nextSearchParams.delete('minRating');
                  return nextSearchParams;
                })
              }
            >
              <option value="">Any rating</option>
              <option value="4">4+ stars</option>
              <option value="4.5">4.5+ stars</option>
            </select>
          </label>
          <label htmlFor="filter-query">
            Search
            <input
              id="filter-query"
              value={searchQuery}
              onChange={(event) =>
                setSearchParams((currentSearchParams) => {
                  const nextSearchParams = new URLSearchParams(currentSearchParams);
                  if (event.target.value) nextSearchParams.set('q', event.target.value);
                  else nextSearchParams.delete('q');
                  return nextSearchParams;
                })
              }
              placeholder="Name or area"
            />
          </label>
        </div>
        {caretakersQuery.isPending ? (
          <LoadingState label="Finding local caretakers…" />
        ) : caretakersQuery.isError ? (
          <ErrorState
            message={caretakersQuery.error.message}
            onRetry={() => void caretakersQuery.refetch()}
          />
        ) : caretakersQuery.data.length === 0 ? (
          <EmptyState
            title="No approved caretakers found"
            message="Try another Pune area or service, or check back as our local community grows."
            action={
              <Link className="button" to="/register">
                Become a caretaker
              </Link>
            }
          />
        ) : (
          <div className="caretaker-grid">
            {caretakersQuery.data
              .filter(
                (caretaker) =>
                  !directoryFilters.get('maxPrice') ||
                  caretaker.hourlyRate <= Number(directoryFilters.get('maxPrice')),
              )
              .filter(
                (caretaker) =>
                  !directoryFilters.get('minRating') ||
                  (caretaker.rating ?? 0) >= Number(directoryFilters.get('minRating')),
              )
              .map((caretaker) => (
                <article className="caretaker-card" key={caretaker.id}>
                  <div className="caretaker-image">
                    <ProfileImage src={caretaker.photoUrl} name={caretaker.name} />
                    <span className="verified">
                      <ShieldCheck size={14} /> Approved
                    </span>
                  </div>
                  <div className="caretaker-details">
                    <div className="rating">
                      <Star size={15} fill="currentColor" />
                      {caretaker.rating ? Number(caretaker.rating).toFixed(1) : 'New'}{' '}
                      <small>({caretaker.reviewCount} reviews)</small>
                    </div>
                    <h2>{caretaker.name}</h2>
                    <p>{caretaker.bio || 'A caring local companion for your pet.'}</p>
                    <div className="location">
                      <MapPin size={14} />
                      {caretaker.serviceAreas}
                    </div>
                    <div className="card-bottom">
                      <b>
                        ₹{formatINR(caretaker.hourlyRate)}
                        <small> / hour</small>
                      </b>
                      <Link className="text-link" to={`/caretakers/${caretaker.id}`}>
                        View profile <ArrowRight size={15} />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
          </div>
        )}
      </section>
    </main>
  );
}
