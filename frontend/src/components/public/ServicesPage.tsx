import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useServices } from '../../hooks/useCaretakerData';
import { formatINR } from '../../utils';
import { ErrorState, LoadingState } from '../common/feedback/FeedbackStates';

export function ServicesPage() {
  const servicesQuery = useServices();
  if (servicesQuery.isPending)
    return (
      <main className="container page-main">
        <LoadingState label="Loading services…" />
      </main>
    );
  if (servicesQuery.isError)
    return (
      <main className="container page-main">
        <ErrorState
          message={servicesQuery.error.message}
          onRetry={() => void servicesQuery.refetch()}
        />
      </main>
    );
  return (
    <main className="page-main">
      <section className="listing-intro container">
        <p className="eyebrow">Good days, covered</p>
        <h1>
          Services &<br />
          <span>thoughtful pricing.</span>
        </h1>
        <p>
          Choose the kind of care that fits your pet’s routine. Rates are listed transparently by
          our approved local companions.
        </p>
      </section>
      <section className="container service-grid">
        {servicesQuery.data.map((service) => (
          <article className="service-card service-copy-card" key={service.id}>
            <div>
              <span className="service-icon">🐾</span>
              <h2>{service.name}</h2>
              <p>{service.description}</p>
              <div className="card-bottom">
                <b>
                  ₹{formatINR(service.hourlyRate)}
                  <small> / hour</small>
                </b>
                <Link className="text-link" to={`/caretakers?serviceId=${service.id}`}>
                  Find care <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
